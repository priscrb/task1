import { createServer } from "http";
import { Readable } from "stream";
import { LocalStorageRepository } from "./repositories/LocalStorageRepository.js";
import { RedisCacheService } from "./services/RedisCacheService.js";
import { VideoService } from "./services/VideoService.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  validateUploadRequest,
  validateStreamRequest,
  validateRangeHeader,
} from "./middleware/requestValidator.js";
import { performanceMonitor } from "./middleware/performanceMonitor.js";
import logger from "./utils/logger.js";

// Initialize services with dependency injection
const storage = new LocalStorageRepository();
const cache = new RedisCacheService();
const videoService = new VideoService(storage, cache);

const server = createServer(async (req, res) => {
  const monitor = performanceMonitor(req);

  try {
    // Handle CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      monitor.end();
      return;
    }

    // Log incoming request
    logger.info("Incoming request", {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });

    // Route handling
    if (req.method === "POST" && req.url === "/upload/video") {
      // Validate request before processing
      validateUploadRequest(req);

      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const filename = await videoService.uploadVideo(buffer);
      logger.info("Video uploaded successfully", { filename });
      res.writeHead(204);
      res.end();
    } else if (req.method === "GET" && req.url.startsWith("/static/video/")) {
      const filename = req.url.split("/static/video/")[1];
      validateStreamRequest(filename);

      const range = req.headers.range;
      const { stream, size } = await videoService.streamVideo(filename, range);

      if (range) {
        const rangeParams = validateRangeHeader(range, size);
        const start = rangeParams.start;
        const end = rangeParams.end;
        const contentLength = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength,
          "Content-Type": "video/mp4",
        });
        logger.info("Streaming partial content", { filename, start, end });
      } else {
        res.writeHead(200, {
          "Content-Length": size,
          "Content-Type": "video/mp4",
        });
        logger.info("Streaming full content", { filename });
      }

      stream.pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  } catch (error) {
    errorHandler(error, req, res);
  } finally {
    monitor.end();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
