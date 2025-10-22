import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { redisCache } from "@/lib/redis-cache";
import { getUserFromToken } from "@/lib/auth";

// Vercel serverless function configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface CSVRow {
  Date: string;
  "Start Time"?: string;
  "End Time"?: string;
  Location: string;
  "Workout Type": string;
  "Duration (min)"?: string;
  "Active Calories"?: string;
  "Total Calories"?: string;
  "Avg Heart Rate (bpm)"?: string;
  "Effort (1–10)"?: string;
  Station?: string;
  Component?: string;
  Exercise?: string;
  "Class Name"?: string;
  Instructor?: string;
  Description?: string;
  Notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    let text: string;

    // Check if request is JSON (pasted text) or FormData (file upload)
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      // Handle pasted CSV text
      const body = await request.json();
      text = body.csvText;

      if (!text) {
        return NextResponse.json(
          { error: "No CSV data provided" },
          { status: 400 }
        );
      }
    } else {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      text = await file.text();
    }

    const parsed = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing error", details: parsed.errors },
        { status: 400 }
      );
    }

    // Helper function to parse integers with defaults
    const parseIntOrDefault = (
      value: string | undefined,
      defaultValue: number
    ): number => {
      if (!value || value.trim() === "") return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    // Group by date to create one workout session per date
    const sessionsByDate = new Map<string, any[]>();

    console.log("Parsed data:", parsed.data);
    console.log("Number of rows:", parsed.data.length);
    console.log("CSV headers:", Object.keys(parsed.data[0] || {}));

    parsed.data.forEach((row, index) => {
      const dateStr = row.Date;
      console.log(`Processing row ${index + 1}:`, row);

      if (!dateStr || dateStr.trim() === "") {
        console.log(`Skipping row ${index + 1} - no date`);
        return;
      }

      if (!sessionsByDate.has(dateStr)) {
        sessionsByDate.set(dateStr, []);
      }
      sessionsByDate.get(dateStr)!.push(row);
    });

    console.log("Sessions by date:", Array.from(sessionsByDate.entries()));

    let totalSessions = 0;
    let totalExercises = 0;

    // Get the authenticated user from the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authenticatedUser = await getUserFromToken(token);

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    console.log("Import using authenticated user:", authenticatedUser);

    // Create one workout session per date with multiple exercises
    for (const [dateStr, rows] of sessionsByDate) {
      const firstRow = rows[0];
      console.log(`Creating session for date: ${dateStr}`);
      console.log("First row:", firstRow);

      // No automatic category creation - user will add categories manually

      // Check if a session already exists for this date, location, and workout type
      const existingSession = await prisma.workoutSession.findFirst({
        where: {
          userId: authenticatedUser.id,
          date: new Date(dateStr),
          location: firstRow.Location,
          workoutType: firstRow["Workout Type"],
        },
      });

      if (existingSession) {
        console.log(
          `Session already exists for ${dateStr} at ${firstRow.Location} (${firstRow["Workout Type"]}), skipping...`
        );
        continue; // Skip this session
      }

      // Create the main workout session (no categories assigned)
      const workoutSession = await prisma.workoutSession.create({
        data: {
          userId: authenticatedUser.id,
          date: new Date(dateStr),
          location: firstRow.Location,
          workoutType: firstRow["Workout Type"],
          duration: parseIntOrDefault(firstRow["Duration (min)"], 0),
          activeCalories: parseIntOrDefault(firstRow["Active Calories"], 0),
          totalCalories: parseIntOrDefault(firstRow["Total Calories"], 0),
          avgHeartRate: parseIntOrDefault(firstRow["Avg Heart Rate (bpm)"], 0),
          effort: parseIntOrDefault(firstRow["Effort (1–10)"], 5),
          sessionName: `${firstRow["Workout Type"]} Session`,
          notes: `Imported session with ${rows.length} exercises`,
        },
      });

      console.log("Created workout session:", {
        id: workoutSession.id,
        date: workoutSession.date,
        location: workoutSession.location,
        workoutType: workoutSession.workoutType,
      });

      totalSessions++;

      // Create individual exercises within the session
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const component =
          row.Station || row.Component || row["Class Name"] || "Exercise";
        const exercise =
          row.Exercise || row.Description || row["Class Name"] || "Exercise";
        const notes = row.Notes || "";

        try {
          await prisma.workoutExercise.create({
            data: {
              sessionId: workoutSession.id,
              component: component,
              exercise: exercise,
              notes: notes,
              orderInSession: i + 1, // Order within the session
            },
          });
          console.log(`Created exercise: ${exercise} (${component})`);
          totalExercises++;
        } catch (exerciseError) {
          console.error(`Failed to create exercise ${i + 1}:`, exerciseError);
          console.error(`Exercise data:`, { component, exercise, notes });
          throw exerciseError;
        }
      }
    }

    // Clear Redis cache after successful import - AGGRESSIVE CLEARING
    try {
      // Clear user-specific cache
      await redisCache.clearAllUserCache(authenticatedUser.id);

      // Also clear ALL cache keys to be absolutely sure
      await redisCache.clear();

      // Verify cache is cleared by checking if we can get user workouts (should be null)
      const testCache = await redisCache.getUserWorkoutsPaginated(
        authenticatedUser.id,
        10,
        0,
        undefined
      );
      console.log(
        "🧹 Cache verification - getUserWorkouts result:",
        testCache ? "CACHED" : "NULL (good)"
      );
    } catch (cacheError: any) {
      console.error("⚠️ Failed to clear Redis cache:", cacheError);
      console.error("⚠️ Cache error details:", cacheError.message);
      // Don't fail the import if cache clearing fails
    }

    return NextResponse.json(
      {
        success: true,
        count: totalSessions,
        exercises: totalExercises,
        message: `Successfully imported ${totalSessions} workout sessions with ${totalExercises} exercises`,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Cache-Invalidate": "true",
        },
      }
    );
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import workouts", details: error.message },
      { status: 500 }
    );
  }
}
