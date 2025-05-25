import { parentPort, workerData } from "worker_threads";
import { fileTypeFromBuffer } from "file-type";

/**
 * Worker thread for validating video files
 * This runs in a separate thread to not block the event loop
 */
async function validateVideo(buffer) {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    // Check if it's a video file
    const isVideo = fileType?.mime.startsWith("video/");

    // Check file size (10MB limit)
    const isValidSize = buffer.length <= 10 * 1024 * 1024;

    parentPort.postMessage({
      valid: isVideo && isValidSize,
      error: !isVideo
        ? "Invalid file type"
        : !isValidSize
        ? "File too large"
        : null,
    });
  } catch (error) {
    parentPort.postMessage({
      valid: false,
      error: "Error validating file",
    });
  }
}

// Start validation when data is received
validateVideo(workerData);
