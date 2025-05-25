export class VideoServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends VideoServiceError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends VideoServiceError {
  constructor(message) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class StorageError extends VideoServiceError {
  constructor(message) {
    super(message, 500);
    this.name = "StorageError";
  }
}

export class CacheError extends VideoServiceError {
  constructor(message) {
    super(message, 500);
    this.name = "CacheError";
  }
}
