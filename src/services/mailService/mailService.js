const { Resend } = require("resend");
const buildProgramApprovalHTML = require("./templates/buildProgramApprovalHTML");
const buildProgramDecisionToCreatorHTML = require("./templates/buildProgramDecisionToCreatorHTML");
const buildProgramDecisionToReviewerHTML = require("./templates/buildProgramDecisionToReviewerHTML");
const { getBranchInfo } = require("../../integrations/core/branchService");

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = "Trung Nam Hub <onboarding@trungnamhub.io.vn>";

const formatToEmail = (toInput) => {
  if (Array.isArray(toInput)) {
    return toInput.map((e) => e.trim()).filter(Boolean);
  }
  if (typeof toInput === "string") {
    return toInput.split(",").map((e) => e.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Send email requesting program approval
 */
const sendProgramApprovalMail = async ({
  toEmail,
  programTitle,
  reviewerName,
  senderName,
  approvalLink,
  lessonCount = 0,
}) => {
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env");
    throw new Error("Resend API key is not configured. Please set RESEND_API_KEY in your environment variables.");
    return;
  }

  try {
    const htmlContent = buildProgramApprovalHTML({
      programTitle,
      reviewerName,
      senderName,
      approvalLink,
      lessonCount,
    });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: formatToEmail(toEmail),
      subject: `🔔 Yêu cầu phê duyệt chương trình: ${programTitle}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Program Approval Mail Error:", response.error);
      return;
    }

    console.log(`📧 Program Approval email sent to: ${toEmail} (for ${reviewerName}) | ID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Mail Service Error - Failed to send program approval email:", error);
  }
};

/**
 * Send notification email to Program Creator about reviewer decision (Approve/Reject)
 */
const sendProgramDecisionMailToCreator = async ({
  toEmail,
  creatorName,
  reviewerName,
  program,
  action,
  comment,
  programStatus,
  programLink,
}) => {
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env");
    return;
  }

  try {
    const branch = getBranchInfo(program.branchId);
    const branchName = branch?.name || `Ngành ${program.branchId}`;
    const programTitle = `Quý ${program.quarter}/${program.year} - ${branchName}`;

    const isApprove = action === "APPROVE";
    const subjectPrefix = isApprove ? "✅ [Đã Phê Duyệt]" : "❌ [Từ Chối / Cần Sửa]";
    const subject = `${subjectPrefix} ${reviewerName} đã ${isApprove ? "phê duyệt" : "từ chối"} Chương trình ${programTitle}`;

    const htmlContent = buildProgramDecisionToCreatorHTML({
      program,
      creatorName,
      reviewerName,
      action,
      comment,
      programStatus,
      programLink,
    });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: formatToEmail(toEmail),
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Decision to Creator Mail Error:", response.error);
      return;
    }

    console.log(`📧 Program Decision email sent to Creator (${toEmail}) | ID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Mail Service Error - Failed to send decision email to creator:", error);
  }
};

/**
 * Send confirmation email to Reviewer after they approve/reject
 */
const sendProgramDecisionConfirmationToReviewer = async ({
  toEmail,
  reviewerName,
  program,
  action,
  comment,
  programStatus,
  programLink,
}) => {
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env");
    return;
  }

  try {
    const branch = getBranchInfo(program.branchId);
    const branchName = branch?.name || `Ngành ${program.branchId}`;
    const programTitle = `Quý ${program.quarter}/${program.year} - ${branchName}`;

    const isApprove = action === "APPROVE";
    const subject = `📋 Xác nhận: Bạn đã ${isApprove ? "phê duyệt" : "từ chối"} Chương trình ${programTitle}`;

    const htmlContent = buildProgramDecisionToReviewerHTML({
      program,
      reviewerName,
      action,
      comment,
      programStatus,
      programLink,
    });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: formatToEmail(toEmail),
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Decision Confirmation to Reviewer Mail Error:", response.error);
      return;
    }

    console.log(`📧 Program Decision Confirmation sent to Reviewer (${toEmail}) | ID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Mail Service Error - Failed to send confirmation email to reviewer:", error);
  }
};

module.exports = {
  sendProgramApprovalMail,
  sendProgramDecisionMailToCreator,
  sendProgramDecisionConfirmationToReviewer,
};

