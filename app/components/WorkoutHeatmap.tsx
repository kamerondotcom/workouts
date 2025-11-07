"use client";

import { useWorkoutDataStore } from "../stores/workoutDataStore";

// GraphQL query moved to centralized store

interface WorkoutHeatmapProps {
  className?: string;
}

export default function WorkoutHeatmap({
  className = "",
}: WorkoutHeatmapProps) {
  // Use centralized store for workout data
  const { workouts, workoutsLoading, workoutsError } = useWorkoutDataStore();

  if (workoutsLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-3"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-300 dark:bg-gray-600 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (workoutsError) {
    return null; // Fail silently
  }

  // Get the last 7 days starting from Monday (using UTC to avoid timezone issues)
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    // Get the Monday of this week using UTC
    const dayOfWeek = date.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + mondayOffset);

    // Add i days to get each day of the week starting from Monday
    monday.setUTCDate(monday.getUTCDate() + i);
    return monday;
  });

  // Count workouts for each day
  const workoutCounts = last7Days.map((date, dayIndex) => {
    // Use local time for day boundaries to match workout dates
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayWorkouts = workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);

      // Use UTC date comparison to avoid timezone issues
      const workoutYear = workoutDate.getUTCFullYear();
      const workoutMonth = workoutDate.getUTCMonth();
      const workoutDay = workoutDate.getUTCDate();

      const dayYear = dayStart.getUTCFullYear();
      const dayMonth = dayStart.getUTCMonth();
      const dayDay = dayStart.getUTCDate();

      return (
        workoutYear === dayYear &&
        workoutMonth === dayMonth &&
        workoutDay === dayDay
      );
    });

    return dayWorkouts.length;
  });

  const maxWorkouts = Math.max(...workoutCounts, 1); // At least 1 to avoid division by zero

  // Get day names starting with Monday
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Color intensity based on workout count
  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    return Math.min(count / maxWorkouts, 1);
  };

  // Get color based on intensity
  const getColor = (intensity: number) => {
    if (intensity === 0)
      return "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600";
    if (intensity <= 0.25) return "bg-green-200 dark:bg-green-800";
    if (intensity <= 0.5) return "bg-green-300 dark:bg-green-700";
    if (intensity <= 0.75) return "bg-green-400 dark:bg-green-600";
    return "bg-green-500 dark:bg-green-500";
  };

  // Get text color based on intensity
  const getTextColor = (intensity: number) => {
    if (intensity === 0) return "text-gray-400 dark:text-gray-500";
    if (intensity <= 0.5) return "text-gray-700 dark:text-gray-300";
    return "text-white";
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
          Weekly Activity
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded transition-colors duration-300"></div>
            <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded transition-colors duration-300"></div>
            <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded transition-colors duration-300"></div>
            <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded transition-colors duration-300"></div>
            <div className="w-3 h-3 bg-green-500 dark:bg-green-500 rounded transition-colors duration-300"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {last7Days.map((date, index) => {
          const count = workoutCounts[index];
          const intensity = getIntensity(count);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={index}
              className={`
                relative h-8 rounded flex items-center justify-center text-xs font-medium
                ${getColor(intensity)} ${getTextColor(intensity)}
                ${
                  isToday
                    ? "ring-1 ring-blue-400 dark:ring-blue-300 shadow-sm border-b-2 border-blue-500 dark:border-blue-400"
                    : ""
                }
                transition-all duration-300 ease-in-out hover:scale-105
              `}
              title={`${
                dayNames[index]
              } ${date.toLocaleDateString()}: ${count} workout${
                count !== 1 ? "s" : ""
              }`}
            >
              <span
                className={`transition-all duration-300 ease-in-out ${
                  count > 0
                    ? "font-semibold"
                    : "font-medium text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500"
                }`}
              >
                {count > 0 ? count : dayNames[index]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center transition-colors duration-300">
        {workoutCounts.reduce((sum, count) => sum + count, 0)} workouts this
        week
      </div>
    </div>
  );
}
