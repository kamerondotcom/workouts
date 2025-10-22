"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

const CREATE_WORKOUT = gql`
  mutation CreateWorkout(
    $date: String!
    $location: String!
    $workoutType: String!
    $duration: Int!
    $activeCalories: Int!
    $totalCalories: Int!
    $avgHeartRate: Int!
    $effort: Int!
    $component: String!
    $exercise: String!
    $notes: String
    $isWeightTracked: Boolean
  ) {
    createWorkout(
      date: $date
      location: $location
      workoutType: $workoutType
      duration: $duration
      activeCalories: $activeCalories
      totalCalories: $totalCalories
      avgHeartRate: $avgHeartRate
      effort: $effort
      component: $component
      exercise: $exercise
      notes: $notes
      isWeightTracked: $isWeightTracked
    ) {
      id
    }
  }
`;

interface AddWorkoutProps {
  sessionDate?: string;
  sessionLocation?: string;
  sessionWorkoutType?: string;
  sessionDuration?: number;
  sessionActiveCalories?: number;
  sessionTotalCalories?: number;
  sessionAvgHeartRate?: number;
  sessionEffort?: number;
  onWorkoutAdded?: () => void;
}

export default function AddWorkout({
  sessionDate,
  sessionLocation,
  sessionWorkoutType,
  sessionDuration,
  sessionActiveCalories,
  sessionTotalCalories,
  sessionAvgHeartRate,
  sessionEffort,
  onWorkoutAdded,
}: AddWorkoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [component, setComponent] = useState("");
  const [exercise, setExercise] = useState("");
  const [notes, setNotes] = useState("");
  const [isWeightTracked, setIsWeightTracked] = useState(false);

  const [createWorkout, { loading }] = useMutation(CREATE_WORKOUT, {
    onCompleted: () => {
      // Clear service worker cache after creating workout
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
        console.log(
          "Service Worker cache clear requested after workout creation"
        );
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionDate || !sessionLocation || !sessionWorkoutType) {
      alert("Cannot add exercise: session details are missing");
      return;
    }

    try {
      await createWorkout({
        variables: {
          date: sessionDate,
          location: sessionLocation,
          workoutType: sessionWorkoutType,
          duration: sessionDuration || 0,
          activeCalories: sessionActiveCalories || 0,
          totalCalories: sessionTotalCalories || 0,
          avgHeartRate: sessionAvgHeartRate || 0,
          effort: sessionEffort || 5,
          component,
          exercise,
          notes: notes || null,
          isWeightTracked,
        },
      });

      // Reset form
      setComponent("");
      setExercise("");
      setNotes("");
      setIsWeightTracked(false);
      setIsOpen(false);

      if (onWorkoutAdded) {
        onWorkoutAdded();
      }
    } catch (error) {
      console.error("Error creating workout:", error);
      alert("Failed to add exercise");
    }
  };

  if (!isOpen) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2 transition-colors touch-manipulation"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Exercise
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Component
            </label>
            <input
              type="text"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              placeholder="e.g., Warm Up, Component 1"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exercise
            </label>
            <input
              type="text"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="e.g., 10 Push-ups"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="weight-tracked"
            checked={isWeightTracked}
            onChange={(e) => setIsWeightTracked(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="weight-tracked"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Track weight & reps (add details after creating)
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setComponent("");
              setExercise("");
              setNotes("");
              setIsWeightTracked(false);
            }}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors touch-manipulation"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
