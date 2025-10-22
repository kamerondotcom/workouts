import { getRedisClient } from "./redis";

// Redis-based cache implementation
class RedisCache {
  private defaultTTL = 3600000; // 1 hour in milliseconds

  async set(
    key: string,
    data: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const client = await getRedisClient();
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl,
      });

      // Convert TTL from milliseconds to seconds for Redis
      const ttlSeconds = Math.ceil(ttl / 1000);
      await client.setEx(key, ttlSeconds, serializedData);
    } catch (error) {
      console.error("Redis cache set error:", error);
      // Don't throw error to prevent breaking the app
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const client = await getRedisClient();
      const serializedData = await client.get(key);

      if (!serializedData) {
        return null;
      }

      const parsed = JSON.parse(serializedData);

      // Check if expired (additional safety check)
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        await this.delete(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error("Redis cache get error:", error);
      return null; // Return null on error to prevent breaking the app
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(key);
    } catch (error) {
      console.error("Redis cache delete error:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.flushDb();
    } catch (error) {
      console.error("Redis cache clear error:", error);
    }
  }

  // Clear cache for a specific user's workouts
  async clearUserWorkouts(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const pattern = `${userId}:workouts*`;
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error("Redis cache clear user workouts error:", error);
    }
  }

  // Get cache stats
  async getStats(): Promise<{ size: number; keys: string[] }> {
    try {
      const client = await getRedisClient();
      const keys = await client.keys("*");
      return {
        size: keys.length,
        keys,
      };
    } catch (error) {
      console.error("Redis cache stats error:", error);
      return { size: 0, keys: [] };
    }
  }

  // Set user workouts with specific key pattern
  async setUserWorkouts(
    userId: string,
    workouts: any[],
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const key = `${userId}:workouts`;
    await this.set(key, workouts, ttl);
  }

  // Get user workouts with specific key pattern
  async getUserWorkouts(userId: string): Promise<any[] | null> {
    const key = `${userId}:workouts`;
    return await this.get(key);
  }

  // Set user workouts with pagination
  async setUserWorkoutsPaginated(
    userId: string,
    limit: number,
    offset: number,
    categoryId: string | undefined,
    workouts: any[],
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const key = `${userId}:workouts:${limit}:${offset}:${categoryId || "all"}`;
    await this.set(key, workouts, ttl);
  }

  // Get user workouts with pagination
  async getUserWorkoutsPaginated(
    userId: string,
    limit: number,
    offset: number,
    categoryId: string | undefined
  ): Promise<any[] | null> {
    const key = `${userId}:workouts:${limit}:${offset}:${categoryId || "all"}`;
    return await this.get(key);
  }

  // Set all user exercises for fast in-memory filtering
  async setUserExercises(
    userId: string,
    exercises: any[],
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const key = `${userId}:exercises`;
    await this.set(key, exercises, ttl);
  }

  // Get all user exercises for filtering
  async getUserExercises(userId: string): Promise<any[] | null> {
    const key = `${userId}:exercises`;
    return await this.get(key);
  }

  // Clear user exercises cache
  async clearUserExercisesCache(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = `${userId}:exercises`;
      await client.del(key);
    } catch (error) {
      console.error("Redis cache clear user exercises error:", error);
    }
  }

  // Clear user categories cache
  async clearUserCategoriesCache(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = `${userId}:categories:all`;
      await client.del(key);
    } catch (error) {
      console.error("Redis cache clear user categories error:", error);
    }
  }

  // Clear all user-related cache (workouts + exercises + categories)
  async clearAllUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.clearUserWorkouts(userId),
      this.clearUserExercisesCache(userId),
      this.clearUserCategoriesCache(userId),
    ]);
  }
}

export const redisCache = new RedisCache();
