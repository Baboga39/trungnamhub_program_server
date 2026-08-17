const path = require("path");
const prisma = require("../libs/prisma");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Helper to fix UTF-8 encoding for filenames parsed as latin1 by busboy/multer
 */
function fixUtf8Filename(filename) {
  if (!filename) return "";
  try {
    return Buffer.from(filename, "latin1").toString("utf8");
  } catch (err) {
    return filename;
  }
}

/**
 * Determine Cloudinary resource type from MIME type.
 *
 * Images  -> image
 * Videos  -> video
 * PDF / Word / Excel / PowerPoint / ZIP / other documents -> raw
 */
function getCloudinaryResourceType(mimeType) {
  if (!mimeType) {
    return "raw";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "raw";
}

/**
 * Upload buffer directly to Cloudinary using stream.
 */
function uploadToCloudinaryStream(fileBuffer, file, options = {}) {
  return new Promise((resolve, reject) => {
    const resourceType = getCloudinaryResourceType(
      file.mimetype
    );

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "trungnamhub/program_files",
        resource_type: resourceType,
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    streamifier
      .createReadStream(fileBuffer)
      .pipe(uploadStream);
  });
}

/**
 * Upload file to a Program Lesson.
 */
async function uploadFileToLesson(
  lessonId,
  file,
  userScope = {}
) {
  // --------------------------------------------------
  // 1. Validate Lesson
  // --------------------------------------------------

  const lesson = await prisma.programLesson.findUnique({
    where: {
      id: Number(lessonId),
    },
    include: {
      quarterProgram: true,
    },
  });

  if (!lesson) {
    throw {
      statusCode: 404,
      message: "Program lesson not found",
    };
  }

  // --------------------------------------------------
  // 2. Branch authorization
  // --------------------------------------------------

  if (
    userScope.restrictedBranch &&
    String(lesson.quarterProgram.branchId) !==
      String(userScope.restrictedBranch)
  ) {
    throw {
      statusCode: 403,
      message:
        "Forbidden: Cannot upload files to lesson of another branch",
    };
  }

  // --------------------------------------------------
  // 3. Validate file
  // --------------------------------------------------

  if (!file || !file.buffer) {
    throw {
      statusCode: 400,
      message: "File is required",
    };
  }

  if (!file.originalname) {
    throw {
      statusCode: 400,
      message: "Original file name is required",
    };
  }

  // Fix UTF-8 encoding for Vietnamese filenames
  const decodedOriginalName = fixUtf8Filename(file.originalname);

  // --------------------------------------------------
  // 4. Determine resource type
  // --------------------------------------------------

  const resourceType = getCloudinaryResourceType(
    file.mimetype
  );

  const extension = path
    .extname(decodedOriginalName)
    .toLowerCase();

  const publicId =
    resourceType === "raw"
      ? `lesson_${lessonId}_${Date.now()}${extension}`
      : `lesson_${lessonId}_${Date.now()}`;

  console.log("[File Upload] Preparing upload", {
    lessonId: Number(lessonId),
    originalName: decodedOriginalName,
    mimeType: file.mimetype,
    resourceType,
    extension,
    publicId,
  });

  // --------------------------------------------------
  // 7. Upload to Cloudinary
  // --------------------------------------------------

  let cloudinaryResult;

  try {
    cloudinaryResult = await uploadToCloudinaryStream(
      file.buffer,
      file,
      {
        public_id: publicId,
      }
    );
  } catch (error) {
    console.error(
      "[File Upload] Cloudinary upload failed:",
      error
    );

    throw {
      statusCode: 500,
      message: "Failed to upload file to Cloudinary",
      detail: error.message,
    };
  }

  // --------------------------------------------------
  // 8. Save metadata to PostgreSQL
  // --------------------------------------------------

  let programFile;

  try {
    programFile = await prisma.programFile.create({
      data: {
        programLessonId: Number(lessonId),

        originalName: decodedOriginalName,

        fileName: decodedOriginalName,

        mimeType: file.mimetype,

        size: file.size,

        cloudinaryPublicId:
          cloudinaryResult.public_id,

        cloudinaryUrl:
          cloudinaryResult.secure_url,
      },
    });
  } catch (error) {
    /**
     * IMPORTANT:
     *
     * If DB insert fails after Cloudinary upload,
     * remove the Cloudinary file to prevent orphan files.
     */

    console.error(
      "[File Upload] Database insert failed:",
      error
    );

    try {
      await cloudinary.uploader.destroy(
        cloudinaryResult.public_id,
        {
          resource_type: resourceType,
        }
      );

      console.log(
        "[File Upload] Rollback Cloudinary asset:",
        cloudinaryResult.public_id
      );
    } catch (rollbackError) {
      console.error(
        "[File Upload] Cloudinary rollback failed:",
        rollbackError.message
      );
    }

    throw {
      statusCode: 500,
      message: "Failed to save file information",
      detail: error.message,
    };
  }

  // --------------------------------------------------
  // 9. Log result
  // --------------------------------------------------

  console.log("[File Upload] Success", {
    lessonId: Number(lessonId),
    fileId: programFile.id,
    originalName: programFile.originalName,
    mimeType: programFile.mimeType,
    resourceType,
    publicId: programFile.cloudinaryPublicId,
    url: programFile.cloudinaryUrl,
  });

  // --------------------------------------------------
  // 10. Response
  // --------------------------------------------------

  return {
    id: programFile.id,
    programLessonId:
      programFile.programLessonId,

    originalName:
      programFile.originalName,

    fileName:
      programFile.fileName,

    mimeType:
      programFile.mimeType,

    size:
      programFile.size,

    url:
      programFile.cloudinaryUrl,

    createdAt:
      programFile.createdAt,
  };
}

/**
 * Get all files of a Program Lesson.
 */
async function getFilesByLessonId(lessonId) {
  const files = await prisma.programFile.findMany({
    where: {
      programLessonId: Number(lessonId),
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return files.map((file) => ({
    id: file.id,

    programLessonId:
      file.programLessonId,

    originalName:
      file.originalName,

    fileName:
      file.fileName,

    mimeType:
      file.mimeType,

    size:
      file.size,

    url:
      file.cloudinaryUrl,

    createdAt:
      file.createdAt,
  }));
}

/**
 * Delete a file from Cloudinary + Database.
 */
async function deleteFileFromLesson(
  lessonId,
  fileId,
  userScope = {}
) {
  // --------------------------------------------------
  // 1. Find file
  // --------------------------------------------------

  const fileRecord = await prisma.programFile.findUnique({
    where: {
      id: Number(fileId),
    },

    include: {
      programLesson: {
        include: {
          quarterProgram: true,
        },
      },
    },
  });

  if (
    !fileRecord ||
    fileRecord.programLessonId !== Number(lessonId)
  ) {
    throw {
      statusCode: 404,
      message: "Program file not found",
    };
  }

  // --------------------------------------------------
  // 2. Branch authorization
  // --------------------------------------------------

  if (
    userScope.restrictedBranch &&
    String(
      fileRecord.programLesson.quarterProgram.branchId
    ) !== String(userScope.restrictedBranch)
  ) {
    throw {
      statusCode: 403,
      message:
        "Forbidden: Cannot delete file of another branch",
    };
  }

  // --------------------------------------------------
  // 3. Determine resource type
  // --------------------------------------------------

  const resourceType =
    getCloudinaryResourceType(
      fileRecord.mimeType
    );

  console.log("[File Delete] Preparing delete", {
    fileId: Number(fileId),

    lessonId: Number(lessonId),

    originalName:
      fileRecord.originalName,

    mimeType:
      fileRecord.mimeType,

    resourceType,

    publicId:
      fileRecord.cloudinaryPublicId,
  });

  // --------------------------------------------------
  // 4. Delete Cloudinary asset
  // --------------------------------------------------

  if (fileRecord.cloudinaryPublicId) {
    try {
      const result =
        await cloudinary.uploader.destroy(
          fileRecord.cloudinaryPublicId,
          {
            resource_type: resourceType,
          }
        );

      console.log("[Cloudinary Delete]", {
        publicId:
          fileRecord.cloudinaryPublicId,

        resourceType,

        result: result.result,
      });

      /**
       * Cloudinary can return:
       *
       * "ok"
       * "not found"
       */

      if (
        result.result !== "ok" &&
        result.result !== "not found"
      ) {
        console.warn(
          "[Cloudinary Delete] Unexpected result:",
          result
        );
      }
    } catch (error) {
      /**
       * IMPORTANT:
       *
       * We DON'T delete DB record if Cloudinary
       * deletion throws an actual error.
       *
       * This prevents DB and Cloudinary from getting
       * out of sync.
       */

      console.error(
        "[Cloudinary Delete] Failed:",
        error
      );

      throw {
        statusCode: 500,
        message:
          "Failed to delete file from Cloudinary",
        detail: error.message,
      };
    }
  }

  // --------------------------------------------------
  // 5. Delete database record
  // --------------------------------------------------

  await prisma.programFile.delete({
    where: {
      id: Number(fileId),
    },
  });

  console.log("[File Delete] Database record deleted", {
    fileId: Number(fileId),
  });

  return {
    id: Number(fileId),
  };
}

module.exports = {
  uploadFileToLesson,
  getFilesByLessonId,
  deleteFileFromLesson,
};