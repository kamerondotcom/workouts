import { createClient, RedisClientType } from "redis";

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL;

let redisClient: RedisClientType | null = null;

// Create Redis client
export function createRedisClient(): RedisClientType {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      tls: true, // Enable TLS for secure connection
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis Client Connected");
  });

  redisClient.on("ready", () => {
    console.log("Redis Client Ready");
  });

  redisClient.on("end", () => {
    console.log("Redis Client Disconnected");
  });

  return redisClient;
}

// Get Redis client instance
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createRedisClient();
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

// Close Redis connection
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Health check for Redis
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error("Redis connection check failed:", error);
    return false;
  }
}
