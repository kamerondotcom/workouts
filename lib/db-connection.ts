// Database connection optimization for Vercel serverless
import { prisma } from "./prisma";

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Warm up database connection
export async function warmupDatabase() {
  try {
    // Run a simple query to establish connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection warmed up");
  } catch (error) {
    console.error("Database warmup failed:", error);
  }
}

// Optimize for serverless
export async function optimizeForServerless() {
  try {
    // Set connection limits for serverless
    await prisma.$executeRaw`SET statement_timeout = '30s'`;
    await prisma.$executeRaw`SET idle_in_transaction_session_timeout = '30s'`;
    console.log("Database optimized for serverless");
  } catch (error) {
    console.error("Database optimization failed:", error);
  }
}

// Connection pooling optimization
export async function optimizeConnectionPool() {
  try {
    // Optimize connection pool for serverless
    await prisma.$executeRaw`SET max_connections = 10`;
    await prisma.$executeRaw`SET shared_preload_libraries = 'pg_stat_statements'`;
    console.log("Connection pool optimized");
  } catch (error) {
    console.error("Connection pool optimization failed:", error);
  }
}
