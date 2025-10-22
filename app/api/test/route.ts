import { NextResponse } from "next/server";

// Use Edge Runtime for faster responses
export const runtime = "edge";
export const preferredRegion = "auto";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
  });
}
