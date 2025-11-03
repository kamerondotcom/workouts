"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useWorkoutDataStore } from "../stores/workoutDataStore";
import Modal from "./Modal";

const UPDATE_SESSION_CATEGORIES = gql`
  mutation UpdateWorkoutSessionCategories(
    $sessionId: String!
    $categoryIds: [String!]!
  ) {
    updateWorkoutSessionCategories(
      sessionId: $sessionId
      categoryIds: $categoryIds
    )
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      categories {
        id
        name
        color
      }
      cache {
        key
        status
        timestamp
        ttl
        totalExercises
        filteredCount
        returnedCount
      }
    }
  }
`;

interface Category {
  id: string;
  name: string;
  color: string;
}

interface EditWorkoutSessionProps {
  workoutId: string;
  date: string;
  currentCategories: Category[];
  onClose: () => void;
  onUpdate: () => void;
  onNavigateToCategories?: () => void;
}

export default function EditWorkoutSession({
  workoutId,
  date,
  currentCategories,
  onClose,
  onUpdate,
  onNavigateToCategories,
}: EditWorkoutSessionProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    currentCategories.map((c) => c.id)
  );

  // Use centralized store for categories
  const { categories } = useWorkoutDataStore();
  const [updateCategories, { loading }] = useMutation(
    UPDATE_SESSION_CATEGORIES,
    {
      onCompleted: () => {
        // Clear service worker cache after updating categories
        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: "CLEAR_CACHE",
          });
        }
      },
    }
  );

  // Categories are now available directly from the store
  // No need for data transformation or cache logging

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCategories({
        variables: {
          sessionId: workoutId,
          categoryIds: selectedCategoryIds,
        },
        refetchQueries: ["GetWorkoutSessions", "GetCategories"],
        awaitRefetchQueries: true,
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating categories:", error);
      alert(`Failed to update categories: ${error.message}`);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Workout Categories"
      size="md"
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select categories for this workout session. Changes will apply to all
        exercises in this session.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categories */}
        {categories.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-manipulation ${
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

              {/* Add New Category Pill */}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToCategories) {
                    onClose();
                    onNavigateToCategories();
                  }
                }}
                className="px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-manipulation border-2 border-dashed border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Add new category"
              >
                <span className="flex items-center gap-1">
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add New
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No categories available. Create categories in the Categories tab
            first.
          </div>
        )}

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
            {loading ? "Saving..." : "Save Categories"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
