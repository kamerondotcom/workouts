"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useWorkoutDataStore } from "../stores/workoutDataStore";
import Modal from "./Modal";

const CREATE_WORKOUT_SESSION = gql`
  mutation CreateWorkoutSession(
    $date: String!
    $location: String!
    $workoutType: String!
    $duration: Int!
    $activeCalories: Int!
    $totalCalories: Int!
    $avgHeartRate: Int!
    $effort: Int!
    $sessionName: String
    $notes: String
    $categoryIds: [String!]
  ) {
    createWorkoutSession(
      date: $date
      location: $location
      workoutType: $workoutType
      duration: $duration
      activeCalories: $activeCalories
      totalCalories: $totalCalories
      avgHeartRate: $avgHeartRate
      effort: $effort
      sessionName: $sessionName
      notes: $notes
      categoryIds: $categoryIds
    ) {
      id
      date
      location
      workoutType
    }
  }
`;

interface AddWorkoutSessionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddWorkoutSession({
  isOpen,
  onClose,
  onSuccess,
}: AddWorkoutSessionProps) {
  const { categories, fetchWorkouts } = useWorkoutDataStore();

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Get current time in HH:MM format
  const currentTime = `${String(today.getHours()).padStart(2, "0")}:${String(
    today.getMinutes()
  ).padStart(2, "0")}`;

  const [date, setDate] = useState(todayString);
  const [time, setTime] = useState(currentTime);
  const [location, setLocation] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [duration, setDuration] = useState("");
  const [activeCalories, setActiveCalories] = useState("");
  const [totalCalories, setTotalCalories] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [effort, setEffort] = useState("5");
  const [sessionName, setSessionName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [createWorkoutSession, { loading }] = useMutation(
    CREATE_WORKOUT_SESSION,
    {
      onCompleted: () => {
        // Clear service worker cache after creating workout
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "CLEAR_CACHE",
          });
        }
        // Reset form
        handleReset();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      },
    }
  );

  const handleReset = () => {
    setDate(todayString);
    setTime(currentTime);
    setLocation("");
    setWorkoutType("");
    setDuration("");
    setActiveCalories("");
    setTotalCalories("");
    setAvgHeartRate("");
    setEffort("5");
    setSessionName("");
    setNotes("");
    setSelectedCategoryIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time into ISO string
    const dateTimeString = `${date}T${time}:00`;

    try {
      await createWorkoutSession({
        variables: {
          date: dateTimeString,
          location: location.trim() || "Home",
          workoutType: workoutType.trim() || "General",
          duration: parseInt(duration) || 0,
          activeCalories: parseInt(activeCalories) || 0,
          totalCalories: parseInt(totalCalories) || 0,
          avgHeartRate: parseInt(avgHeartRate) || 0,
          effort: parseInt(effort) || 5,
          sessionName: sessionName.trim() || null,
          notes: notes.trim() || null,
          categoryIds:
            selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        },
      });
    } catch (error) {
      console.error("Error creating workout session:", error);
      alert("Failed to create workout session");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Workout Session" size="lg">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        style={{
          maxHeight: "calc(100dvh - 8rem)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Location and Workout Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., The Yard Gym, Home"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              placeholder="e.g., Functional Strength, Cardio"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Duration and Calories */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Active Calories
            </label>
            <input
              type="number"
              value={activeCalories}
              onChange={(e) => setActiveCalories(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Calories
            </label>
            <input
              type="number"
              value={totalCalories}
              onChange={(e) => setTotalCalories(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Heart Rate and Effort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avg Heart Rate (bpm)
            </label>
            <input
              type="number"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
              placeholder="0"
              min="0"
              max="220"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Effort (1-10)
            </label>
            <input
              type="number"
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Session Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Name (optional)
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Morning Workout, Leg Day"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategoryIds.includes(category.id)
                      ? "text-white ring-2 ring-offset-2 ring-blue-500"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  style={
                    selectedCategoryIds.includes(category.id)
                      ? { backgroundColor: category.color }
                      : {}
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any additional notes about this workout session..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

