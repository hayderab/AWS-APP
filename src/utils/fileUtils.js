/**
 * Format file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB", "512 KB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} File extension (e.g., "pdf", "jpg")
 */
export const getFileExtension = (filename) => {
  if (!filename) return "";
  return filename.split(".").pop().toLowerCase();
};

/**
 * Check if file is a PDF
 * @param {string} filename - The filename
 * @returns {boolean} True if file is PDF
 */
export const isPdfFile = (filename) => {
  return getFileExtension(filename) === "pdf";
};

/**
 * Validate file size against maximum allowed size
 * @param {number} bytes - File size in bytes
 * @param {number} maxSizeMB - Maximum allowed size in MB
 * @returns {boolean} True if file size is valid
 */
export const isValidFileSize = (bytes, maxSizeMB = 50) => {
  const maxBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return bytes <= maxBytes;
};
