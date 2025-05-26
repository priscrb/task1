import { jest } from "@jest/globals";
import { Readable } from "stream";
import { RedisCacheService } from "../../src/services/RedisCacheService.js";

class TestReadable extends Readable {
  constructor(data) {
    super();
    this.data = data;
  }

  _read() {
    this.push(this.data);
    this.push(null);
  }
}

class TestRedisCacheService extends RedisCacheService {
  constructor() {
    super("redis://localhost:6379");

    this.originalConnect = this.connect;

    this.client = {
      isOpen: false,
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      exists: jest.fn().mockResolvedValue(0),
      quit: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
    };
  }
}

describe("RedisCacheService", () => {
  let cacheService;
  const testKey = "test-video";
  const testData = Buffer.from("test video data");
  const testTTL = 60;

  beforeEach(() => {
    cacheService = new TestRedisCacheService();
    jest.clearAllMocks();
  });

  describe("connect/disconnect", () => {
    it("should connect when not already connected", async () => {
      cacheService.client.isOpen = false;
      const connectSpy = jest.spyOn(cacheService.client, "connect");

      await cacheService.connect();

      expect(connectSpy).toHaveBeenCalled();
    });

    it("should not connect when already connected", async () => {
      cacheService.client.isOpen = true;
      const connectSpy = jest.spyOn(cacheService.client, "connect");

      await cacheService.connect();

      expect(connectSpy).not.toHaveBeenCalled();
    });

    it("should disconnect when connected", async () => {
      cacheService.client.isOpen = true;
      const quitSpy = jest.spyOn(cacheService.client, "quit");

      await cacheService.disconnect();

      expect(quitSpy).toHaveBeenCalled();
    });

    it("should not disconnect when not connected", async () => {
      cacheService.client.isOpen = false;
      const quitSpy = jest.spyOn(cacheService.client, "quit");

      await cacheService.disconnect();

      expect(quitSpy).not.toHaveBeenCalled();
    });
  });

  describe("set", () => {
    it("should set data correctly", async () => {
      await cacheService.set(testKey, testData, testTTL);
      expect(cacheService.client.set).toHaveBeenCalledWith(testKey, testData, {
        EX: testTTL,
      });
    });

    it("should handle stream data when setting", async () => {
      const mockStream = new TestReadable(testData);
      await cacheService.set(testKey, mockStream, testTTL);
      expect(cacheService.client.set).toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("should return null when getting non-existent key", async () => {
      cacheService.client.get.mockResolvedValue(null);

      const result = await cacheService.get(testKey);

      expect(result).toBeNull();
      expect(cacheService.client.get).toHaveBeenCalledWith(testKey);
    });

    it("should convert buffer to stream when getting data", async () => {
      cacheService.client.get.mockResolvedValue(testData);

      const result = await cacheService.get(testKey);

      expect(result).toBeInstanceOf(Readable);
      expect(cacheService.client.get).toHaveBeenCalledWith(testKey);
    });
  });

  describe("exists", () => {
    it("should check if key exists", async () => {
      cacheService.client.exists.mockResolvedValueOnce(1);

      const result = await cacheService.exists(testKey);

      expect(result).toBe(true);
      expect(cacheService.client.exists).toHaveBeenCalledWith(testKey);
    });

    it("should check if key does not exist", async () => {
      cacheService.client.exists.mockResolvedValueOnce(0);

      const result = await cacheService.exists(testKey);

      expect(result).toBe(false);
      expect(cacheService.client.exists).toHaveBeenCalledWith(testKey);
    });
  });
});
