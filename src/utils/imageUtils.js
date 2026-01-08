export const separateImages = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return { newFiles: [], existingPaths: [] };
  }

  const newFiles = [];
  const existingPaths = [];

  for (const img of images) {
    // CASE 1: New uploaded file
    if (img.file instanceof File) {
      newFiles.push(img.file);
    }
    // CASE 2: Existing image (URL string)
    else if (img.isExisting && img.preview) {
      // Extract path from full URL
      let path = img.preview;

      // Convert full URL to path
      if (path.startsWith("http://") || path.startsWith("https://")) {
        try {
          const urlObj = new URL(path);
          path = urlObj.pathname; // Extract /uploads/products/...
        } catch (e) {
          console.warn("Failed to parse URL:", path);
        }
      }

      existingPaths.push(path);
    }
    // CASE 3: Direct File (fallback)
    else if (img instanceof File) {
      newFiles.push(img);
    }
  }

  console.log("📦 Separated images:", {
    newFiles: newFiles.length,
    existingPaths: existingPaths.length,
    paths: existingPaths,
  });

  return { newFiles, existingPaths };
};
