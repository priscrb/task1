import { Worker } from "worker_threads";
import { join } from "path";
import { randomUUID } from "crypto";
import { PassThrough } from "stream";
import logger from "../utils/logger.js";
import {
  ValidationError,
  NotFoundError,
  StorageError,
} from "../utils/errors.js";

export class VideoService {
  constructor(storageRepository, cacheService) {
    this.storage = storageRepository;
    this.cache = cacheService;
  }

  async validateVideo(buffer) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        join(process.cwd(), "src", "workers", "videoValidator.js"),
        {
          workerData: buffer,
        }
      );

      worker.on("message", resolve);
      worker.on("error", (err) => {
        logger.error("Video validation worker error:", err);
        reject(new ValidationError("Failed to validate video"));
      });
      worker.on("exit", (code) => {
        if (code !== 0) {
          logger.error(`Video validation worker exited with code ${code}`);
          reject(new ValidationError("Video validation failed"));
        }
      });
    });
  }

  async uploadVideo(videoBuffer) {
    logger.info("Starting video upload process");

    // Validate video in worker thread
    const validation = await this.validateVideo(videoBuffer);
    if (!validation.valid) {
      logger.warn("Video validation failed:", validation.error);
      throw new ValidationError(validation.error);
    }

    // Generate unique filename
    const filename = `${randomUUID()}.mp4`;
    logger.debug("Generated filename:", filename);

    try {
      // Store in cache first (as per requirement)
      await this.cache.set(filename, videoBuffer);
      logger.debug("Video stored in cache");

      // Then persist to storage
      await this.storage.saveVideo(filename, videoBuffer);
      logger.info("Video upload completed successfully");

      return filename;
    } catch (error) {
      logger.error("Failed to store video:", error);
      throw new StorageError("Failed to store video");
    }
  }

  async streamVideo(filename, range) {
    logger.info("Starting video streaming process", { filename, range });

    try {
      // Check cache first
      const exists = await this.cache.exists(filename);
      if (exists) {
        logger.info("Cache HIT for video", { filename });
        const cachedStream = await this.cache.get(filename);
        if (cachedStream) {
          return { stream: cachedStream, size: cachedStream.readableLength };
        }
      }

      logger.info("Cache MISS for video, fetching from storage", { filename });
      // If not in cache, check storage
      const exists_in_storage = await this.storage.videoExists(filename);
      if (!exists_in_storage) {
        logger.warn("Video not found:", filename);
        throw new NotFoundError("Video not found");
      }

      // Get from storage and update cache
      const { stream, size } = await this.storage.readVideo(filename, range);
      logger.debug("Video retrieved from storage");

      // Cache the video if no range is specified (full video request)
      if (!range) {
        logger.info("Caching full video content", { filename });
        const cacheStream = stream.pipe(new PassThrough());
        this.cache
          .set(filename, cacheStream)
          .catch((err) => logger.error("Failed to cache video:", err));
      }

      return { stream, size };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Failed to stream video:", error);
      throw new StorageError("Failed to stream video");
    }
  }
}
