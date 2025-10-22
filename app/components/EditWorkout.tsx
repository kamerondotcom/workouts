"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import Modal from "./Modal";

const UPDATE_WORKOUT_EXERCISE = gql`
  mutation UpdateWorkoutExercise(
    $id: String!
    $component: String
    $exercise: String
    $notes: String
    $isWeightTracked: Boolean
    $workoutSets: [WorkoutSetInput!]
  ) {
    updateWorkoutExercise(
      id: $id
      component: $component
      exercise: $exercise
      notes: $notes
      isWeightTracked: $isWeightTracked
      workoutSets: $workoutSets
    ) {
      id
      component
      exercise
      notes
      isWeightTracked
      workoutSets {
        id
        setNumber
        weight
        reps
      }
    }
  }
`;

interface WorkoutSet {
  id?: string;
  setNumber: number;
  weight: number;
  reps: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface WorkoutExercise {
  id: string;
  component: string;
  exercise: string;
  notes?: string;
  isWeightTracked: boolean;
  weight?: number;
  reps?: number;
  sets?: number;
  workoutSets: WorkoutSet[];
}

interface EditWorkoutProps {
  workout: WorkoutExercise;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditWorkout({
  workout,
  onClose,
  onUpdate,
}: EditWorkoutProps) {
  const [component, setComponent] = useState(workout.component);
  const [exercise, setExercise] = useState(workout.exercise);
  const [notes, setNotes] = useState(workout.notes || "");
  const [isWeightTracked, setIsWeightTracked] = useState(
    workout.isWeightTracked
  );

  // Initialize sets from workout
  const initialSets =
    workout.workoutSets && workout.workoutSets.length > 0
      ? workout.workoutSets
      : [{ setNumber: 1, weight: 0, reps: 0 }];

  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>(initialSets);

  const [updateWorkout, { loading }] = useMutation(UPDATE_WORKOUT_EXERCISE, {
    onCompleted: () => {
      // Clear service worker cache after updating exercise
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
        console.log(
          "Service Worker cache clear requested after exercise update"
        );
      }

      // Dispatch event to show shimmer loading during save
      window.dispatchEvent(new CustomEvent("workout-saving"));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("Updating workout exercise:", {
        id: workout.id,
        component,
        exercise,
        notes: notes || null,
        isWeightTracked,
        workoutSets: isWeightTracked
          ? workoutSets.map((set, idx) => ({
              setNumber: idx + 1,
              weight: parseFloat(set.weight.toString()),
              reps: parseInt(set.reps.toString(), 10),
            }))
          : [],
      });

      const result = await updateWorkout({
        variables: {
          id: workout.id,
          component,
          exercise,
          notes: notes || null,
          isWeightTracked,
          workoutSets: isWeightTracked
            ? workoutSets.map((set, idx) => ({
                setNumber: idx + 1,
                weight: parseFloat(set.weight.toString()),
                reps: parseInt(set.reps.toString(), 10),
              }))
            : [],
        },
      });

      console.log("Update result:", result);
      console.log(
        "Workout exercise updated successfully, triggering complete refresh"
      );
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating workout:", error);
    }
  };

  const addSet = () => {
    const newSetNumber = workoutSets.length + 1;
    const lastSet = workoutSets[workoutSets.length - 1];
    setWorkoutSets([
      ...workoutSets,
      {
        setNumber: newSetNumber,
        weight: lastSet?.weight || 0,
        reps: lastSet?.reps || 0,
      },
    ]);
  };

  const removeSet = (index: number) => {
    if (workoutSets.length > 1) {
      setWorkoutSets(workoutSets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (
    index: number,
    field: "weight" | "reps",
    value: string
  ) => {
    const newSets = [...workoutSets];
    newSets[index] = {
      ...newSets[index],
      [field]:
        value === ""
          ? 0
          : field === "weight"
          ? parseFloat(value)
          : parseInt(value, 10),
    };
    setWorkoutSets(newSets);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Exercise" size="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Component Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Component
          </label>
          <input
            type="text"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Warmup, Main Set, Finisher"
            required
          />
        </div>

        {/* Exercise Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Exercise Name
          </label>
          <input
            type="text"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Weight Tracking Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Track Weight & Reps
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Enable weight tracking for this exercise
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsWeightTracked(!isWeightTracked)}
            className={`${
              isWeightTracked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                isWeightTracked ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {/* Sets Management */}
        {isWeightTracked && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sets ({workoutSets.length})
              </label>
              <button
                type="button"
                onClick={addSet}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                title="Add Set"
              >
                <svg
                  className="w-4 h-4"
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
              </button>
            </div>

            <div className="space-y-2">
              {workoutSets.map((set, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-semibold text-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        step="0.5"
                        value={set.weight || ""}
                        onChange={(e) =>
                          updateSet(index, "weight", e.target.value)
                        }
                        placeholder="Weight (lbs)"
                        autoComplete="off"
                        autoCorrect="off"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.reps || ""}
                        onChange={(e) =>
                          updateSet(index, "reps", e.target.value)
                        }
                        placeholder="Reps"
                        autoComplete="off"
                        autoCorrect="off"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSet(index)}
                    disabled={workoutSets.length === 1}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove set"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
