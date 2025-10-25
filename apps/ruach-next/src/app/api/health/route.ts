import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 *
 * Used by Docker healthcheck and load balancers to verify the application is running.
 * Returns 200 OK if healthy, 503 Service Unavailable if unhealthy.
 */
export async function GET() {
  try {
    const uptime =
      (process as NodeJS.Process & { uptime?: () => number }).uptime?.() ?? 0;
    // Basic health check - verify the application is responding
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime,
      environment: process.env.NODE_ENV,
    };

    // Optional: Add additional checks here
    // - Database connectivity
    // - External service availability
    // - Memory usage thresholds

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
