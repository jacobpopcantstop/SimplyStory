import axios from "axios";
import sharp from "sharp";
import { redis } from "@/lib/redis";

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 800;

export async function fetchAndProcessImage(
  url: string,
  width = 800,
  quality = 80
): Promise<{ buffer: Buffer; contentType: string }> {
  const cacheKey = `img:${url}:${width}:${quality}`;

  // Check Redis cache
  const cached = await redis.getBuffer(cacheKey);
  if (cached) {
    return { buffer: cached, contentType: "image/webp" };
  }

  // Fetch original image
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 8000,
    maxContentLength: 10 * 1024 * 1024, // 10MB max
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SimplyStory/1.0)",
      Referer: new URL(url).origin,
    },
  });

  const inputBuffer = Buffer.from(response.data);

  // Process with sharp: resize + convert to WebP (strips EXIF/tracking)
  const processedBuffer = await sharp(inputBuffer)
    .resize(Math.min(width, MAX_WIDTH), MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  // Cache in Redis
  await redis.setex(cacheKey, CACHE_TTL, processedBuffer);

  return { buffer: processedBuffer, contentType: "image/webp" };
}
