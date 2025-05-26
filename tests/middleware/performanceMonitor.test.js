import { jest } from "@jest/globals";
import { performanceMonitor } from "../../src/middleware/performanceMonitor.js";
import logger from "../../src/utils/logger.js";

describe("PerformanceMonitor", () => {
  let mockInfo;

  beforeEach(() => {
    mockInfo = jest.spyOn(logger, "info").mockImplementation(() => {});

    jest.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1250);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log request completion with duration", () => {
    const mockReq = {
      method: "GET",
      url: "/test-url",
      headers: {
        "content-length": "1024",
        "content-type": "video/mp4",
      },
    };

    const monitor = performanceMonitor(mockReq);
    monitor.end();

    expect(mockInfo).toHaveBeenCalledWith("Request completed", {
      method: "GET",
      url: "/test-url",
      duration_ms: 250,
      content_length: "1024",
      content_type: "video/mp4",
    });
  });

  it("should handle missing headers", () => {
    const mockReq = {
      method: "GET",
      url: "/test-url",
      headers: {},
    };

    const monitor = performanceMonitor(mockReq);
    monitor.end();

    expect(mockInfo).toHaveBeenCalledWith("Request completed", {
      method: "GET",
      url: "/test-url",
      duration_ms: 250,
      content_length: undefined,
      content_type: undefined,
    });
  });

  it("should allow custom start time", () => {
    const mockReq = {
      method: "GET",
      url: "/test-url",
      headers: {},
    };

    Date.now.mockRestore();
    jest.spyOn(Date, "now").mockReturnValueOnce(2000);

    const customStartTime = 1500;
    const monitor = performanceMonitor(mockReq, customStartTime);
    monitor.end();

    expect(mockInfo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        duration_ms: 500,
      })
    );
  });
});
