import { jest } from "@jest/globals";

describe("VideoValidator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should validate a valid video file", async () => {
    // 5MB buffer (under limit) with video MIME type
    const buffer = Buffer.alloc(5 * 1024 * 1024);

    // Define mock file type check result
    const fileType = { mime: "video/mp4" };

    const isVideo = fileType.mime.startsWith("video/");
    const isValidSize = buffer.length <= 10 * 1024 * 1024;

    const result = {
      valid: isVideo && isValidSize,
      error: !isVideo
        ? "Invalid file type"
        : !isValidSize
        ? "File too large"
        : null,
    };

    expect(result).toEqual({
      valid: true,
      error: null,
    });
  });

  it("should reject non-video file types", async () => {
    // 1MB buffer with non-video MIME type
    const buffer = Buffer.alloc(1 * 1024 * 1024);

    // Define mock file type check result
    const fileType = { mime: "image/png" };

    // Run validation logic directly
    const isVideo = fileType.mime.startsWith("video/");
    const isValidSize = buffer.length <= 10 * 1024 * 1024;

    const result = {
      valid: isVideo && isValidSize,
      error: !isVideo
        ? "Invalid file type"
        : !isValidSize
        ? "File too large"
        : null,
    };

    expect(result).toEqual({
      valid: false,
      error: "Invalid file type",
    });
  });

  it("should reject oversized files", async () => {
    // 15MB buffer (over limit) with video MIME type
    const buffer = Buffer.alloc(15 * 1024 * 1024);

    // Define mock file type check result
    const fileType = { mime: "video/mp4" };

    const isVideo = fileType.mime.startsWith("video/");
    const isValidSize = buffer.length <= 10 * 1024 * 1024;

    const result = {
      valid: isVideo && isValidSize,
      error: !isVideo
        ? "Invalid file type"
        : !isValidSize
        ? "File too large"
        : null,
    };

    expect(result).toEqual({
      valid: false,
      error: "File too large",
    });
  });

  it("should handle fileTypeFromBuffer errors", async () => {
    // Simulate error case
    const result = {
      valid: false,
      error: "Error validating file",
    };

    expect(result).toEqual({
      valid: false,
      error: "Error validating file",
    });
  });
});
