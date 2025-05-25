/**
 * Interface for storage implementations
 * This allows us to easily swap storage backends (local fs, S3, etc.)
 */
export class IStorageRepository {
  /**
   * Saves a video file
   * @param {string} filename - The name of the file
   * @param {Buffer|ReadableStream} data - The file data
   * @returns {Promise<void>}
   */
  async saveVideo(filename, data) {
    throw new Error("Method not implemented");
  }

  /**
   * Reads a video file
   * @param {string} filename - The name of the file
   * @param {object} range - Optional range object { start: number, end: number }
   * @returns {Promise<{stream: ReadableStream, size: number}>}
   */
  async readVideo(filename, range) {
    throw new Error("Method not implemented");
  }

  /**
   * Checks if a video exists
   * @param {string} filename - The name of the file
   * @returns {Promise<boolean>}
   */
  async videoExists(filename) {
    throw new Error("Method not implemented");
  }
}
