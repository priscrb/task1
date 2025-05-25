import logger from "../utils/logger.js";
import { VideoServiceError } from "../utils/errors.js";

export function errorHandler(error, req, res) {
  if (error instanceof VideoServiceError) {
    logger.warn({
      message: error.message,
      error: error.name,
      path: req.url,
      method: req.method,
      statusCode: error.statusCode,
    });

    res.writeHead(error.statusCode, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error.message,
        code: error.name,
      })
    );
    return;
  }

  // Unexpected errors
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.url,
    method: req.method,
  });

  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: "Internal Server Error",
      code: "InternalServerError",
    })
  );
}
