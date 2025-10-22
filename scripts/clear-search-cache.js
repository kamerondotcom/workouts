const { createRedisClient } = require("../lib/redis.ts");

async function clearSearchCache() {
  try {
    const redis = await createRedisClient();

    // Clear all exercise caches
    const keys = await redis.keys("*:exercises");
    console.log(`Found ${keys.length} exercise cache keys to clear:`, keys);

    if (keys.length > 0) {
      await redis.del(keys);
      console.log("✅ Cleared all exercise caches");
    } else {
      console.log("ℹ️ No exercise caches found to clear");
    }

    await redis.disconnect();
    console.log("✅ Cache clearing completed");
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
  }
}

clearSearchCache();
