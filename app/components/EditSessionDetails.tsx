"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import Modal from "./Modal";

const UPDATE_WORKOUT_DATETIME = gql`
  mutation UpdateWorkoutDateTime(
    $sessionId: String!
    $newDate: String!
    $newTime: String!
    $location: String
    $workoutType: String
  ) {
    updateWorkoutSessionDateTime(
      sessionId: $sessionId
      newDate: $newDate
      newTime: $newTime
      location: $location
      workoutType: $workoutType
    ) {
      id
      date
      location
      workoutType
      duration
      activeCalories
      totalCalories
      avgHeartRate
      effort
      sessionName
      notes
      categories {
        id
        name
        color
      }
    }
  }
`;

interface EditSessionDetailsProps {
  workoutId: string;
  date: string;
  datetime: string; // Full ISO datetime
  location: string;
  workoutType: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditSessionDetails({
  workoutId,
  date,
  datetime,
  location,
  workoutType,
  onClose,
  onUpdate,
}: EditSessionDetailsProps) {
  // Extract time from the datetime
  const extractTime = (isoString: string) => {
    const d = new Date(isoString);
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [sessionDate, setSessionDate] = useState(date);
  const [sessionTime, setSessionTime] = useState(extractTime(datetime));
  const [sessionLocation, setSessionLocation] = useState(location);
  const [sessionWorkoutType, setSessionWorkoutType] = useState(workoutType);

  const [updateWorkoutDateTime, { loading }] = useMutation(
    UPDATE_WORKOUT_DATETIME,
    {
      update: (cache, { data }) => {
        if ((data as any)?.updateWorkoutSessionDateTime) {
          // Get the current workoutSessions query from cache
          const existingData = cache.readQuery({
            query: gql`
              query GetWorkoutSessions(
                $limit: Int
                $offset: Int
                $categoryId: String
              ) {
                workoutSessions(
                  limit: $limit
                  offset: $offset
                  categoryId: $categoryId
                ) {
                  id
                  date
                  location
                  workoutType
                  duration
                  activeCalories
                  totalCalories
                  avgHeartRate
                  effort
                  sessionName
                  notes
                  exercises {
                    id
                    component
                    exercise
                    notes
                    orderInSession
                    isWeightTracked
                    weight
                    reps
                    sets
                    workoutSets {
                      id
                      setNumber
                      weight
                      reps
                    }
                  }
                  categories {
                    id
                    name
                    color
                  }
                }
              }
            `,
            variables: { limit: 50, offset: 0, categoryId: null },
          });

          if (
            existingData &&
            typeof existingData === "object" &&
            existingData !== null &&
            "workoutSessions" in existingData &&
            Array.isArray(
              (existingData as { workoutSessions: unknown[] }).workoutSessions
            )
          ) {
            // Update the specific workout session in the cache
            const workoutSessions = (
              existingData as {
                workoutSessions: { id: string; [key: string]: unknown }[];
              }
            ).workoutSessions;
            const updatedSessions = workoutSessions.map(
              (session: { id: string; [key: string]: unknown }) =>
                session.id === (data as any).updateWorkoutSessionDateTime.id
                  ? {
                      ...session,
                      ...(data as any).updateWorkoutSessionDateTime,
                    }
                  : session
            );

            // Write the updated data back to cache
            cache.writeQuery({
              query: gql`
                query GetWorkoutSessions(
                  $limit: Int
                  $offset: Int
                  $categoryId: String
                ) {
                  workoutSessions(
                    limit: $limit
                    offset: $offset
                    categoryId: $categoryId
                  ) {
                    id
                    date
                    location
                    workoutType
                    duration
                    activeCalories
                    totalCalories
                    avgHeartRate
                    effort
                    sessionName
                    notes
                    exercises {
                      id
                      component
                      exercise
                      notes
                      orderInSession
                      isWeightTracked
                      weight
                      reps
                      sets
                      workoutSets {
                        id
                        setNumber
                        weight
                        reps
                      }
                    }
                    categories {
                      id
                      name
                      color
                    }
                  }
                }
              `,
              variables: { limit: 50, offset: 0, categoryId: null },
              data: { workoutSessions: updatedSessions },
            });
          }
        }
      },
      onCompleted: () => {
        // Clear service worker cache after updating workout
        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: "CLEAR_CACHE",
          });
          console.log(
            "Service Worker cache clear requested after workout update"
          );
        }
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Updating workout datetime:", {
      workoutId,
      newDate: sessionDate,
      newTime: sessionTime,
    });

    try {
      const result = await updateWorkoutDateTime({
        variables: {
          sessionId: workoutId,
          newDate: sessionDate,
          newTime: sessionTime,
          location: sessionLocation,
          workoutType: sessionWorkoutType,
        },
      });

      console.log("Update result:", result);
      // Add a small delay to ensure the database update has completed
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 100);
    } catch (error: unknown) {
      console.error("Error updating workout datetime:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to update: ${errorMessage}`);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Workout Details"
      size="md"
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Edit the date, time, location, and workout type for this workout.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workout Date
          </label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workout Time
          </label>
          <input
            type="time"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={sessionLocation}
            onChange={(e) => setSessionLocation(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Workout Type Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workout Type
          </label>
          <input
            type="text"
            value={sessionWorkoutType}
            onChange={(e) => setSessionWorkoutType(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
