import { jest } from "@jest/globals";
import { Readable } from "stream";
import { VideoService } from "../../src/services/VideoService.js";
import { NotFoundError, StorageError } from "../../src/utils/errors.js";

class TestReadable extends Readable {
  constructor() {
    super();
  }

  _read() {
    this.push(Buffer.from("test data"));
    this.push(null);
  }

  get readableLength() {
    return 1000;
  }
}

class TestVideoService extends VideoService {
  constructor(storageRepository, cacheService) {
    super(storageRepository, cacheService);

    this.validateVideo = jest.fn().mockResolvedValue({ valid: true });
  }
}

describe("VideoService", () => {
  const mockStorage = {
    saveVideo: jest.fn(),
    readVideo: jest.fn(),
    videoExists: jest.fn(),
  };

  const mockCache = {
    set: jest.fn(),
    get: jest.fn(),
    exists: jest.fn(),
  };

  let videoService;
  let testBuffer;

  beforeEach(() => {
    jest.clearAllMocks();

    videoService = new TestVideoService(mockStorage, mockCache);
    testBuffer = Buffer.from("test video data");
  });

  describe("uploadVideo", () => {
    it("should successfully upload a video", async () => {
      mockCache.set.mockResolvedValue();
      mockStorage.saveVideo.mockResolvedValue();

      const filename = await videoService.uploadVideo(testBuffer);

      expect(filename).toBeDefined();
      expect(filename.endsWith(".mp4")).toBe(true);
      expect(mockCache.set).toHaveBeenCalledWith(filename, testBuffer);
      expect(mockStorage.saveVideo).toHaveBeenCalledWith(filename, testBuffer);
    });

    it("should throw StorageError when saving to storage fails", async () => {
      mockCache.set.mockResolvedValue();
      mockStorage.saveVideo.mockRejectedValue(new Error("Storage failure"));

      await expect(videoService.uploadVideo(testBuffer)).rejects.toThrow(
        StorageError
      );
    });
  });

  describe("streamVideo", () => {
    const testFilename = "test-video.mp4";
    const mockStream = new TestReadable();
    const mockSize = 1000;

    it("should stream from cache when video exists in cache", async () => {
      mockCache.exists.mockResolvedValue(true);
      mockCache.get.mockResolvedValue(mockStream);

      const result = await videoService.streamVideo(testFilename);

      expect(result).toEqual({ stream: mockStream, size: expect.any(Number) });
      expect(mockCache.exists).toHaveBeenCalledWith(testFilename);
      expect(mockCache.get).toHaveBeenCalledWith(testFilename);
      expect(mockStorage.videoExists).not.toHaveBeenCalled();
    });

    it("should stream from storage when video not in cache", async () => {
      mockCache.exists.mockResolvedValue(false);
      mockStorage.videoExists.mockResolvedValue(true);
      mockStorage.readVideo.mockResolvedValue({
        stream: mockStream,
        size: mockSize,
      });

      const result = await videoService.streamVideo(testFilename);

      expect(result).toEqual({ stream: mockStream, size: mockSize });
      expect(mockCache.exists).toHaveBeenCalledWith(testFilename);
      expect(mockStorage.videoExists).toHaveBeenCalledWith(testFilename);
      expect(mockStorage.readVideo).toHaveBeenCalledWith(
        testFilename,
        undefined
      );
    });

    it("should support range requests", async () => {
      const range = { start: 0, end: 100 };
      mockCache.exists.mockResolvedValue(false);
      mockStorage.videoExists.mockResolvedValue(true);
      mockStorage.readVideo.mockResolvedValue({
        stream: mockStream,
        size: mockSize,
      });

      const result = await videoService.streamVideo(testFilename, range);

      expect(result).toEqual({ stream: mockStream, size: mockSize });
      expect(mockStorage.readVideo).toHaveBeenCalledWith(testFilename, range);
    });

    it("should throw NotFoundError when video does not exist", async () => {
      mockCache.exists.mockResolvedValue(false);
      mockStorage.videoExists.mockResolvedValue(false);

      await expect(videoService.streamVideo(testFilename)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
