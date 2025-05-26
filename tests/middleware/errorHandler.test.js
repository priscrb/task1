import { jest } from "@jest/globals";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import {
  ValidationError,
  NotFoundError,
  StorageError,
} from "../../src/utils/errors.js";
import logger from "../../src/utils/logger.js";

describe("ErrorHandler", () => {
  let mockReq;
  let mockRes;
  let mockWarn;
  let mockError;

  beforeEach(() => {
    mockWarn = jest.spyOn(logger, "warn").mockImplementation(() => {});
    mockError = jest.spyOn(logger, "error").mockImplementation(() => {});

    mockReq = {
      url: "/test-url",
      method: "GET",
    };

    mockRes = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle ValidationError correctly", () => {
    const error = new ValidationError("Invalid input");

    errorHandler(error, mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(400, {
      "Content-Type": "application/json",
    });
    expect(mockRes.end).toHaveBeenCalledWith(
      JSON.stringify({
        error: "Invalid input",
        code: "ValidationError",
      })
    );

    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it("should handle NotFoundError correctly", () => {
    const error = new NotFoundError("Resource not found");

    errorHandler(error, mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(404, {
      "Content-Type": "application/json",
    });
    expect(mockRes.end).toHaveBeenCalledWith(
      JSON.stringify({
        error: "Resource not found",
        code: "NotFoundError",
      })
    );

    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it("should handle StorageError correctly", () => {
    const error = new StorageError("Storage failure");

    errorHandler(error, mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(500, {
      "Content-Type": "application/json",
    });
    expect(mockRes.end).toHaveBeenCalledWith(
      JSON.stringify({
        error: "Storage failure",
        code: "StorageError",
      })
    );

    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it("should handle unexpected errors correctly", () => {
    const error = new Error("Unexpected error");
    error.stack = "Error stack trace";

    errorHandler(error, mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(500, {
      "Content-Type": "application/json",
    });
    expect(mockRes.end).toHaveBeenCalledWith(
      JSON.stringify({
        error: "Internal Server Error",
        code: "InternalServerError",
      })
    );

    expect(mockError).toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
