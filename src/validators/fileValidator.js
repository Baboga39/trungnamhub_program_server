function validateUploadFile(file) {
  const errors = [];
  if (!file) {
    errors.push("No file uploaded");
  } else if (!file.buffer) {
    errors.push("File buffer is empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateUploadFile,
};
