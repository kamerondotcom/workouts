const { createClient } = require("redis");

async function clearCache() {
  const client = createClient({
    url: "rediss://red-d3t8romr433s73b5lt70:t3uZ244PBjEj46mYgvbmLc4b6jesIvKm@oregon-keyvalue.render.com:6379",
  });

  try {
    await client.connect();
    console.log("🔗 Connected to Redis");

    // Clear all keys
    const keys = await client.keys("*");
    console.log(`📋 Found ${keys.length} keys in cache`);

    if (keys.length > 0) {
      await client.del(keys);
      console.log("✅ Cleared all cache keys");
    } else {
      console.log("ℹ️ No keys found to clear");
    }
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
  } finally {
    await client.disconnect();
    console.log("🔌 Disconnected from Redis");
  }
}

clearCache();
