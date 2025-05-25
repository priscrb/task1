import { createClient } from "redis";
import { Readable } from "stream";
import { ICacheService } from "../interfaces/ICacheService.js";

export class RedisCacheService extends ICacheService {
  constructor(redisUrl = "redis://localhost:6379") {
    super();
    this.client = createClient({ url: redisUrl });
    this.client.on("error", (err) => console.error("Redis Client Error:", err));
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async set(key, data, ttl = 60) {
    await this.connect();

    try {
      if (data instanceof Buffer) {
        await this.client.set(key, data, { EX: ttl });
      } else if (data instanceof Readable) {
        // Convert stream to buffer for caching
        const chunks = [];
        for await (const chunk of data) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        await this.client.set(key, buffer, { EX: ttl });
      }
    } catch (error) {
      console.error("Cache set error:", error);
      throw new Error("Failed to cache data");
    }
  }

  async get(key) {
    await this.connect();

    try {
      const data = await this.client.get(key);
      if (!data) return null;

      // Convert Buffer back to stream for consistency
      const stream = new Readable();
      stream.push(data);
      stream.push(null);
      return stream;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async exists(key) {
    await this.connect();
    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }
}
