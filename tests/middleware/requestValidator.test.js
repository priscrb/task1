import { jest } from "@jest/globals";
import {
  validateUploadRequest,
  validateStreamRequest,
  validateRangeHeader,
} from "../../src/middleware/requestValidator.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Request Validators", () => {
  describe("validateUploadRequest", () => {
    it("should pass for valid video content type and size", () => {
      const req = {
        headers: {
          "content-type": "video/mp4",
          "content-length": "5242880", // 5MB
        },
      };

      expect(() => validateUploadRequest(req)).not.toThrow();
    });

    it("should throw for non-video content type", () => {
      const req = {
        headers: {
          "content-type": "image/png",
          "content-length": "1000000",
        },
      };

      expect(() => validateUploadRequest(req)).toThrow(ValidationError);
      expect(() => validateUploadRequest(req)).toThrow(
        "Content-Type must be video/*"
      );
    });

    it("should throw for missing content type", () => {
      const req = {
        headers: {
          "content-length": "1000000",
        },
      };

      expect(() => validateUploadRequest(req)).toThrow(ValidationError);
      expect(() => validateUploadRequest(req)).toThrow(
        "Content-Type must be video/*"
      );
    });

    it("should throw for oversized files", () => {
      const req = {
        headers: {
          "content-type": "video/mp4",
          "content-length": "15000000", // 15MB (over limit)
        },
      };

      expect(() => validateUploadRequest(req)).toThrow(ValidationError);
      expect(() => validateUploadRequest(req)).toThrow(
        "File size must be less than 10MB"
      );
    });
  });

  describe("validateStreamRequest", () => {
    it("should pass for valid filename", () => {
      const validFilename = "123e4567-e89b-12d3-a456-426614174000.mp4";

      // Should not throw
      expect(() => validateStreamRequest(validFilename)).not.toThrow();
    });

    it("should throw for invalid filename format", () => {
      const invalidFilename = "malicious-file.exe";

      expect(() => validateStreamRequest(invalidFilename)).toThrow(
        ValidationError
      );
      expect(() => validateStreamRequest(invalidFilename)).toThrow(
        "Invalid filename format"
      );
    });

    it("should throw for empty filename", () => {
      expect(() => validateStreamRequest("")).toThrow(ValidationError);
      expect(() => validateStreamRequest("")).toThrow(
        "Invalid filename format"
      );
    });
  });

  describe("validateRangeHeader", () => {
    const fileSize = 1000000; // 1MB

    it("should return null for missing range", () => {
      const result = validateRangeHeader(null, fileSize);
      expect(result).toBeNull();
    });

    it("should parse valid range header", () => {
      const range = "bytes=0-1000";

      const result = validateRangeHeader(range, fileSize);

      expect(result).toEqual({ start: 0, end: 1000 });
    });

    it("should handle open-ended ranges", () => {
      const range = "bytes=500-";

      const result = validateRangeHeader(range, fileSize);

      expect(result).toEqual({ start: 500, end: fileSize - 1 });
    });

    it("should throw for invalid range format", () => {
      const range = "invalid-range";

      expect(() => validateRangeHeader(range, fileSize)).toThrow(
        ValidationError
      );
      expect(() => validateRangeHeader(range, fileSize)).toThrow(
        "Invalid range header"
      );
    });

    it("should throw for out-of-bounds range", () => {
      const range = "bytes=2000000-3000000"; // Beyond file size

      expect(() => validateRangeHeader(range, fileSize)).toThrow(
        ValidationError
      );
      expect(() => validateRangeHeader(range, fileSize)).toThrow(
        "Invalid range header"
      );
    });

    it("should throw for inverted range", () => {
      const range = "bytes=1000-500"; // End before start

      expect(() => validateRangeHeader(range, fileSize)).toThrow(
        ValidationError
      );
      expect(() => validateRangeHeader(range, fileSize)).toThrow(
        "Invalid range header"
      );
    });
  });
});
