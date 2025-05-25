/**
 * Interface for cache implementations
 * Defines the contract for caching video data
 */
export class ICacheService {
  /**
   * Stores video data in cache
   * @param {string} key - Cache key
   * @param {Buffer|ReadableStream} data - Video data to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<void>}
   */
  async set(key, data, ttl) {
    throw new Error("Method not implemented");
  }

  /**
   * Retrieves video data from cache
   * @param {string} key - Cache key
   * @returns {Promise<Buffer|ReadableStream|null>}
   */
  async get(key) {
    throw new Error("Method not implemented");
  }

  /**
   * Checks if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    throw new Error("Method not implemented");
  }
}
