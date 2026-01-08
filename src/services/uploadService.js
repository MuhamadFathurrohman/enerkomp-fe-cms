const validateFile = (file, options = {}) => {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB dalam bytes
    allowedTypes = ["image/png", "image/jpeg", "image/jpg"],
  } = options;

  // Validasi: file harus ada
  if (!file) {
    return {
      isValid: false,
      error: "No file provided",
    };
  }

  // Validasi tipe file
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File type not allowed. Only PNG and JPG files are accepted.",
    };
  }

  // Validasi ukuran file
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size too large. Maximum size is 2MB.",
    };
  }

  return { isValid: true, error: null };
};

// Ekspor hanya fungsi validasi
export const uploadService = {
  validateFile,
};
