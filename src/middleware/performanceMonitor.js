import logger from "../utils/logger.js";

export function performanceMonitor(req, startTime = Date.now()) {
  return {
    end: () => {
      const duration = Date.now() - startTime;
      logger.info("Request completed", {
        method: req.method,
        url: req.url,
        duration_ms: duration,
        content_length: req.headers["content-length"],
        content_type: req.headers["content-type"],
      });
    },
  };
}
