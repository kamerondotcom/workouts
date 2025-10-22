import { ApolloServer } from "@apollo/server";
import { NextRequest, NextResponse } from "next/server";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";
import { getUserFromToken, extractTokenFromHeader } from "@/lib/auth";
import { warmupDatabase } from "@/lib/db-connection";
import { prisma } from "@/lib/prisma";

// Optimized for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const preferredRegion = "auto";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

let serverStarted = false;

async function startApolloServer() {
  if (!serverStarted) {
    serverStarted = true;
    // Warm up database connection - but don't fail if it doesn't work
    try {
      await warmupDatabase();
    } catch (error) {
      console.error("Database warmup failed:", error);
      // Don't throw - let the app continue
    }
  }
}

// Add connection cleanup
async function cleanupConnections() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error disconnecting from database:", error);
  }
}

export async function POST(request: NextRequest) {
  await startApolloServer();

  try {
    console.log("GraphQL request received");
    const body = await request.json();

    // Extract and verify JWT token from Authorization header
    const authHeader = request.headers.get("authorization");
    console.log("Auth header:", authHeader);
    console.log("All headers:", Object.fromEntries(request.headers.entries()));
    const token = extractTokenFromHeader(authHeader || undefined);
    console.log(
      "Extracted token:",
      token ? `${token.substring(0, 20)}...` : "null"
    );

    let user = null;
    if (token) {
      user = await getUserFromToken(token);
      console.log("User from token:", user ? `${user.email}` : "null");
    }

    // Create authentication context
    const context = { user };
    console.log("Context being passed:", context);

    // Execute the GraphQL query with authentication context
    const response = await server.executeOperation(
      {
        query: body.query,
        variables: body.variables,
        operationName: body.operationName,
      },
      {
        contextValue: context,
      }
    );

    if (response.body.kind === "single") {
      const result = NextResponse.json(response.body.singleResult);

      // Add caching headers for better performance
      result.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
      result.headers.set("Vary", "Authorization");

      return result;
    }

    return NextResponse.json({
      errors: [{ message: "Unsupported response type" }],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { errors: [{ message: errorMessage }] },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "GraphQL endpoint - use POST requests",
  });
}
