const { createRedisClient } = require("../lib/redis.ts");

async function clearCache() {
  try {
    const redis = await createRedisClient();

    // Clear all keys
    const keys = await redis.keys("*");
    console.log(`Found ${keys.length} keys to clear:`, keys);

    if (keys.length > 0) {
      await redis.del(keys);
      console.log("✅ Cleared all caches");
    } else {
      console.log("ℹ️ No caches found to clear");
    }

    await redis.disconnect();
    console.log("✅ Cache clearing completed");
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
  }
}

clearCache();
