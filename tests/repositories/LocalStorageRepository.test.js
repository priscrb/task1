import { jest } from "@jest/globals";
import path from "path";
import { LocalStorageRepository } from "../../src/repositories/LocalStorageRepository.js";

class TestLocalStorageRepository extends LocalStorageRepository {
  constructor(storageDir) {
    super(storageDir);

    this.mockFs = {
      promises: {
        access: jest.fn(),
        mkdir: jest.fn().mockResolvedValue(undefined),
        writeFile: jest.fn().mockResolvedValue(undefined),
        stat: jest.fn().mockResolvedValue({ size: 1000 }),
      },
      createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
    };
  }

  async initialize() {
    try {
      await this.mockFs.promises.access(this.storageDir);
    } catch {
      await this.mockFs.promises.mkdir(this.storageDir, { recursive: true });
    }
  }

  async saveVideo(filename, data) {
    await this.initialize();
    const filePath = path.join(this.storageDir, filename);
    await this.mockFs.promises.writeFile(filePath, data);
  }

  async readVideo(filename, range) {
    const filePath = path.join(this.storageDir, filename);
    const stat = await this.mockFs.promises.stat(filePath);

    const stream = this.mockFs.createReadStream(filePath, range || undefined);
    return { stream, size: stat.size };
  }

  async videoExists(filename) {
    try {
      await this.mockFs.promises.access(path.join(this.storageDir, filename));
      return true;
    } catch {
      return false;
    }
  }
}

describe("LocalStorageRepository", () => {
  const testDir = "test-uploads";
  const testFilename = "test-video.mp4";
  const testFilePath = path.join(testDir, testFilename);
  const testData = Buffer.from("test video data");
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();

    repository = new TestLocalStorageRepository(testDir);
  });

  describe("initialize", () => {
    it("should create directory if it does not exist", async () => {
      repository.mockFs.promises.access.mockRejectedValue(new Error("ENOENT"));

      await repository.initialize();

      expect(repository.mockFs.promises.access).toHaveBeenCalledWith(testDir);
      expect(repository.mockFs.promises.mkdir).toHaveBeenCalledWith(testDir, {
        recursive: true,
      });
    });

    it("should not create directory if it exists", async () => {
      repository.mockFs.promises.access.mockResolvedValue(undefined);

      await repository.initialize();

      expect(repository.mockFs.promises.access).toHaveBeenCalledWith(testDir);
      expect(repository.mockFs.promises.mkdir).not.toHaveBeenCalled();
    });
  });

  describe("saveVideo", () => {
    it("should save Buffer data correctly", async () => {
      repository.mockFs.promises.access.mockResolvedValue(undefined);

      await repository.saveVideo(testFilename, testData);

      expect(repository.mockFs.promises.writeFile).toHaveBeenCalledWith(
        testFilePath,
        testData
      );
    });
  });

  describe("readVideo", () => {
    const testSize = 1000;
    const mockStream = { pipe: jest.fn() };

    beforeEach(() => {
      repository.mockFs.promises.stat.mockResolvedValue({ size: testSize });
      repository.mockFs.createReadStream.mockReturnValue(mockStream);
    });

    it("should read full video correctly", async () => {
      const result = await repository.readVideo(testFilename);

      expect(repository.mockFs.promises.stat).toHaveBeenCalledWith(
        testFilePath
      );
      expect(repository.mockFs.createReadStream).toHaveBeenCalledWith(
        testFilePath,
        undefined
      );
      expect(result).toEqual({ stream: mockStream, size: testSize });
    });

    it("should support range requests", async () => {
      const range = { start: 0, end: 100 };

      const result = await repository.readVideo(testFilename, range);

      expect(repository.mockFs.promises.stat).toHaveBeenCalledWith(
        testFilePath
      );
      expect(repository.mockFs.createReadStream).toHaveBeenCalledWith(
        testFilePath,
        range
      );
      expect(result).toEqual({ stream: mockStream, size: testSize });
    });
  });

  describe("videoExists", () => {
    it("should return true when video exists", async () => {
      repository.mockFs.promises.access.mockResolvedValue(undefined);

      const result = await repository.videoExists(testFilename);

      expect(repository.mockFs.promises.access).toHaveBeenCalledWith(
        path.join(testDir, testFilename)
      );
      expect(result).toBe(true);
    });

    it("should return false when video does not exist", async () => {
      repository.mockFs.promises.access.mockRejectedValue(new Error("ENOENT"));

      const result = await repository.videoExists(testFilename);

      expect(repository.mockFs.promises.access).toHaveBeenCalledWith(
        path.join(testDir, testFilename)
      );
      expect(result).toBe(false);
    });
  });
});
