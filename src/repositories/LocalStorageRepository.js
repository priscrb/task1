import { promises as fs } from "fs";
import { createReadStream } from "fs";
import { join } from "path";
import { IStorageRepository } from "../interfaces/IStorageRepository.js";

export class LocalStorageRepository extends IStorageRepository {
  constructor(storageDir = "uploads") {
    super();
    this.storageDir = storageDir;
  }

  async initialize() {
    try {
      await fs.access(this.storageDir);
    } catch {
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  async saveVideo(filename, data) {
    await this.initialize();
    const filePath = join(this.storageDir, filename);

    if (data instanceof Buffer) {
      await fs.writeFile(filePath, data);
    } else {
      // Handle stream data
      const writeStream = createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        data.pipe(writeStream).on("finish", resolve).on("error", reject);
      });
    }
  }

  async readVideo(filename, range) {
    const filePath = join(this.storageDir, filename);
    const stat = await fs.stat(filePath);

    if (range) {
      const stream = createReadStream(filePath, range);
      return { stream, size: stat.size };
    }

    const stream = createReadStream(filePath);
    return { stream, size: stat.size };
  }

  async videoExists(filename) {
    try {
      await fs.access(join(this.storageDir, filename));
      return true;
    } catch {
      return false;
    }
  }
}
