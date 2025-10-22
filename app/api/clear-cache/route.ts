import { NextRequest, NextResponse } from "next/server";
import { redisCache } from "@/lib/redis-cache";

export async function POST(request: NextRequest) {
  try {
    // Clear all Redis cache
    await redisCache.clear();

    return NextResponse.json({
      success: true,
      message: "Redis cache cleared successfully",
    });
  } catch (error: any) {
    console.error("⚠️ Failed to clear Redis cache:", error);
    return NextResponse.json(
      { error: "Failed to clear Redis cache", details: error.message },
      { status: 500 }
    );
  }
}
