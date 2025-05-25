import { ValidationError } from "../utils/errors.js";

export function validateUploadRequest(req) {
  // Validate content type
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.startsWith("video/")) {
    throw new ValidationError("Content-Type must be video/*");
  }

  // Validate content length
  const contentLength = parseInt(req.headers["content-length"]);
  if (isNaN(contentLength) || contentLength > 10 * 1024 * 1024) {
    throw new ValidationError("File size must be less than 10MB");
  }
}

export function validateStreamRequest(filename) {
  // Validate filename format
  if (!filename || !/^[a-f0-9-]+\.mp4$/.test(filename)) {
    throw new ValidationError("Invalid filename format");
  }
}

export function validateRangeHeader(range, fileSize) {
  if (!range) return null;

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  if (
    isNaN(start) ||
    isNaN(end) ||
    start >= fileSize ||
    end >= fileSize ||
    start > end
  ) {
    throw new ValidationError("Invalid range header");
  }

  return { start, end };
}
