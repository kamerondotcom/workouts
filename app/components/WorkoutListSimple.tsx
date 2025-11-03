"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useWorkoutDataStore } from "../stores/workoutDataStore";
import { useUser } from "../contexts/UserContext";
import WorkoutSkeleton from "./WorkoutSkeleton";
import EditSessionDetails from "./EditSessionDetails";
import EditWorkoutSession from "./EditWorkoutSession";
import WorkoutHeatmap from "./WorkoutHeatmap";
import CategoryFilterDialog from "./CategoryFilterDialog";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useModal } from "../services/modalService";

// GraphQL Mutations
const DELETE_WORKOUT_SESSION = gql`
  mutation DeleteWorkoutSession($sessionId: String!) {
    deleteWorkoutSession(sessionId: $sessionId)
  }
`;

interface WorkoutListSimpleProps {
  onCategoriesLoaded: (categories: any[]) => void;
}

export default function WorkoutListSimple({
  onCategoriesLoaded,
}: WorkoutListSimpleProps) {
  const { isAuthenticated, isLoading } = useUser();
  const {
    workouts,
    categories,
    searchResults,
    workoutsLoading,
    categoriesLoading,
    searchLoading,
    searchError,
    totalWorkouts,
    hasMoreWorkouts,
    searchQuery,
    selectedCategoryIds,
    fetchWorkouts,
    fetchCategories,
    fetchWorkoutCount,
    fetchSearchResults,
    loadMoreWorkouts,
    setSearchQuery,
    setSelectedCategories,
    removeWorkout,
    updateSet,
    createSet,
    updateExerciseName,
    updateExerciseNotes,
    deleteSet,
  } = useWorkoutDataStore();

  const [searchInput, setSearchInput] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(
    new Set()
  );
  const [editingSession, setEditingSession] = useState<{
    workoutId: string;
    date: string;
    categories: any[];
  } | null>(null);

  // Context menu state
  const [showOverlay, setShowOverlay] = useState<string | null>(null);
  const [overlayDismissTimer, setOverlayDismissTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [editingSessionDetails, setEditingSessionDetails] = useState<{
    workoutId: string;
    date: string;
    datetime: string;
    location: string;
    workoutType: string;
  } | null>(null);

  const [editingSet, setEditingSet] = useState<{
    setId: string;
    setNumber: number;
    weight: number;
    reps: number;
    exerciseName: string;
    equipment: string;
  } | null>(null);
  const [savingSet, setSavingSet] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState<{
    exerciseId: string;
    notes: string;
  } | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Focus trap refs
  const notesModalRef = useRef<HTMLDivElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Track previously seen workout IDs to identify new ones
  const [previousWorkoutIds, setPreviousWorkoutIds] = useState<Set<string>>(
    new Set()
  );

  // Search timeout ref for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal and mutations
  const { confirm } = useModal();
  const [deleteWorkoutMutation] = useMutation(DELETE_WORKOUT_SESSION);

  // Initialize data only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchWorkouts(10, 0);
      fetchCategories();
    }
  }, [isAuthenticated, isLoading, fetchWorkouts, fetchCategories]);

  // Listen for CSV import completion events
  useEffect(() => {
    const handleImportComplete = () => {
      // Force refresh with network-only to bypass cache
      fetchWorkouts(10, 0, undefined, true);
      fetchWorkoutCount();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "workout-import-trigger") {
        handleImportComplete();
      }
    };

    // Listen for custom import-complete event
    window.addEventListener("import-complete", handleImportComplete);

    // Listen for localStorage changes (for when component is not mounted during import)
    window.addEventListener("storage", handleStorageChange);

    // Check for existing import trigger on mount
    const importTrigger = localStorage.getItem("workout-import-trigger");
    if (importTrigger) {
      handleImportComplete();
      localStorage.removeItem("workout-import-trigger");
    }

    return () => {
      window.removeEventListener("import-complete", handleImportComplete);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchWorkouts, fetchWorkoutCount]);

  // Focus trap for notes modal
  useEffect(() => {
    if (editingNotes && notesTextareaRef.current) {
      // Focus the textarea when modal opens
      notesTextareaRef.current.focus();
    }
  }, [editingNotes]);

  // Global escape key handler for all modals
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close any open modal in order of priority
        if (editingSet) {
          setEditingSet(null);
        } else if (editingNotes) {
          setEditingNotes(null);
        } else if (editingSessionDetails) {
          setEditingSessionDetails(null);
        } else if (editingSession) {
          setEditingSession(null);
        } else if (isFilterDialogOpen) {
          setIsFilterDialogOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [
    editingSet,
    editingNotes,
    editingSessionDetails,
    editingSession,
    isFilterDialogOpen,
  ]);

  // Focus trap for notes modal
  useEffect(() => {
    if (!editingNotes || !notesModalRef.current) return;

    const modal = notesModalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
      // Escape key is now handled by the global handler above
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingNotes]);

  // Auto-collapse new workouts when they're added
  useEffect(() => {
    if (workouts.length > 0) {
      // Get the current workout IDs
      const currentWorkoutIds = new Set(workouts.map((w) => w.id));

      // Find new workouts (not previously seen)
      const newWorkoutIds = Array.from(currentWorkoutIds).filter(
        (id) => !previousWorkoutIds.has(id)
      );

      // Collapse all new workouts
      if (newWorkoutIds.length > 0) {
        setCollapsedSessions((prev) => {
          const newSet = new Set(prev);
          newWorkoutIds.forEach((id) => newSet.add(id));
          return newSet;
        });
      }

      // Update the previously seen workout IDs
      setPreviousWorkoutIds(currentWorkoutIds);
    }
  }, [workouts.length]); // Remove previousWorkoutIds to avoid infinite loop

  // Pass categories to parent
  useEffect(() => {
    if (categories.length > 0) {
      onCategoriesLoaded(categories);
    }
  }, [categories, onCategoriesLoaded]);

  // Search is now handled above using centralized store

  // Load more workouts
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreWorkouts || workoutsLoading) {
      return;
    }

    setLoadingMore(true);
    try {
      await loadMoreWorkouts();
    } catch (error) {
      console.error("Error loading more workouts:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMoreWorkouts,
    workoutsLoading,
    loadMoreWorkouts,
    workouts.length,
    totalWorkouts,
  ]);

  // Smart scroll-based auto-loading with throttling
  useEffect(() => {
    let isThrottled = false;

    const handleScroll = () => {
      if (isThrottled || !hasMoreWorkouts || workoutsLoading || loadingMore) {
        return;
      }

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Trigger when user is within 200px of the bottom (more sensitive)
      if (scrollTop + windowHeight >= documentHeight - 200) {
        isThrottled = true;
        handleLoadMore();

        // Reset throttle after 300ms (faster response)
        setTimeout(() => {
          isThrottled = false;
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMoreWorkouts, workoutsLoading, loadingMore, handleLoadMore]);

  // Toggle session collapse
  const toggleSession = (sessionId: string) => {
    setCollapsedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Format date helper - handles timezone issues properly
  const formatUTCDate = (dateString: string) => {
    // Handle edge cases
    if (!dateString || typeof dateString !== "string") {
      console.error("Invalid dateString:", dateString);
      return "Invalid Date";
    }

    // Extract just the date part (YYYY-MM-DD) and create a new date in local timezone
    // This avoids timezone conversion issues when displaying dates
    const dateOnly = dateString.split("T")[0]; // Get YYYY-MM-DD part

    // Validate the date format
    if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      console.error("Invalid date format:", dateOnly);
      return "Invalid Date Format";
    }

    const localDate = new Date(dateOnly + "T12:00:00"); // Use noon to avoid timezone issues

    // Check if the date is valid
    if (isNaN(localDate.getTime())) {
      console.error("Invalid date object created from:", dateOnly);
      return "Invalid Date";
    }

    const formatted = localDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return formatted;
  };

  // Context menu helpers
  const startOverlayDismissTimer = useCallback(() => {
    // Clear any existing dismiss timer
    if (overlayDismissTimer) {
      clearTimeout(overlayDismissTimer);
    }

    // Set new timer to auto-hide overlay after 7 seconds
    const timer = setTimeout(() => {
      setShowOverlay(null);
    }, 7000);

    setOverlayDismissTimer(timer);
  }, [overlayDismissTimer]);

  const cancelOverlayDismissTimer = useCallback(() => {
    if (overlayDismissTimer) {
      clearTimeout(overlayDismissTimer);
      setOverlayDismissTimer(null);
    }
  }, [overlayDismissTimer]);

  // Close overlay on escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showOverlay) {
        setShowOverlay(null);
        cancelOverlayDismissTimer();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (showOverlay && !(e.target as Element).closest(".edit-overlay")) {
        setShowOverlay(null);
        cancelOverlayDismissTimer();
      }
    };

    if (showOverlay) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [showOverlay, cancelOverlayDismissTimer]);

  // Handle search using centralized store with debouncing
  const handleSearch = useCallback(
    (query: string) => {
      setSearchInput(query);
      setSearchQuery(query);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (query.trim()) {
        // Debounce the search by 300ms
        searchTimeoutRef.current = setTimeout(() => {
          fetchSearchResults(query, selectedCategoryIds);
        }, 300);
      } else {
        // Clear results by calling fetchSearchResults with empty query
        fetchSearchResults("", selectedCategoryIds);
      }
    },
    [setSearchQuery, fetchSearchResults, selectedCategoryIds]
  );

  // Memoize workout list to prevent unnecessary re-renders
  const memoizedWorkouts = useMemo(() => {
    return workouts.map((session, index) => ({
      ...session,
      key: `${session.id}-${index}`,
    }));
  }, [workouts]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show workout list
  return (
    <div className="space-y-4">
      {/* Workout Heatmap */}
      <WorkoutHeatmap className="mb-6" />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Workouts ({totalWorkouts})
        </h2>
        <button
          onClick={() => setIsFilterDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Show search results if searching */}
      {searchInput.trim() && (
        <div className="space-y-4">
          {searchLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !searchLoading && searchResults.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 mb-2">
                Found {searchResults.length} exercises
              </div>
              {searchResults.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  {/* Compact Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {editingExercise?.exerciseId === exercise.id ? (
                          <input
                            type="text"
                            value={editingExercise.exerciseName}
                            onChange={(e) =>
                              setEditingExercise({
                                ...editingExercise,
                                exerciseName: e.target.value,
                              })
                            }
                            onBlur={async () => {
                              if (editingExercise) {
                                try {
                                  await updateExerciseName(
                                    editingExercise.exerciseId,
                                    editingExercise.exerciseName
                                  );
                                  setEditingExercise(null);
                                } catch (error) {
                                  console.error(
                                    "Failed to update exercise name:",
                                    error
                                  );
                                  setEditingExercise(null);
                                }
                              }
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && editingExercise) {
                                try {
                                  await updateExerciseName(
                                    editingExercise.exerciseId,
                                    editingExercise.exerciseName
                                  );
                                  setEditingExercise(null);
                                } catch (error) {
                                  console.error(
                                    "Failed to update exercise name:",
                                    error
                                  );
                                  setEditingExercise(null);
                                }
                              } else if (e.key === "Escape") {
                                setEditingExercise(null);
                              }
                            }}
                            className="text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 focus:outline-none transition-all duration-200 ease-in-out border-b-2 border-blue-500 w-full"
                            autoFocus
                          />
                        ) : (
                          <h3
                            className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border-b-2 border-transparent"
                            onDoubleClick={() =>
                              setEditingExercise({
                                exerciseId: exercise.id,
                                exerciseName: exercise.exercise,
                              })
                            }
                          >
                            {exercise.exercise}
                          </h3>
                        )}

                        {/* Component and Session Info in one line */}
                        <div className="flex items-center gap-3 mt-1">
                          {exercise.component && (
                            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
                              {exercise.component}
                            </span>
                          )}
                          {exercise.session && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {exercise.session.sessionName || "Workout"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  exercise.session.date
                                ).toLocaleDateString()}
                              </span>

                              {exercise.session.categories &&
                              exercise.session.categories.length > 0 ? (
                                <>
                                  <span>•</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {exercise.session.categories.map(
                                      (category) => (
                                        <span
                                          key={category.id}
                                          className="text-xs px-1.5 py-0.5 rounded text-white"
                                          style={{
                                            backgroundColor: category.color,
                                          }}
                                        >
                                          {category.name}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  (No categories)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compact Sets Display */}
                    {exercise.workoutSets && exercise.workoutSets.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {exercise.workoutSets.length} sets
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            {exercise.workoutSets.slice(0, 6).map((set) => (
                              <span
                                key={set.id}
                                className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                              >
                                {set.weight
                                  ? `${set.weight}×${set.reps}`
                                  : `${set.reps} reps`}
                              </span>
                            ))}
                            {exercise.workoutSets.length > 6 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                                +{exercise.workoutSets.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        No sets recorded
                      </div>
                    )}

                    {/* Compact Notes */}
                    {exercise.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Notes:
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {exercise.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : !searchLoading ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No exercises found matching "{searchInput}"
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Show workout list if not searching */}
      {!searchInput.trim() && workoutsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <WorkoutSkeleton key={i} />
          ))}
        </div>
      ) : !searchInput.trim() && memoizedWorkouts.length > 0 ? (
        <div className="space-y-4">
          {memoizedWorkouts.map((session, index) => {
            const isCollapsed = collapsedSessions.has(session.id);

            // Get the primary category color for the workout card
            const primaryCategory =
              session.categories && session.categories.length > 0
                ? session.categories[0]
                : null;

            const cardStyle = primaryCategory
              ? { backgroundColor: primaryCategory.color }
              : { background: "linear-gradient(to right, #3B82F6, #8B5CF6)" }; // fallback gradient

            return (
              <div
                key={session.key}
                className="rounded-lg shadow-lg overflow-hidden"
                style={cardStyle}
              >
                <div
                  className="p-6 cursor-pointer relative"
                  onClick={() => {
                    // Don't toggle while overlay is visible
                    if (showOverlay === session.id) return;
                    toggleSession(session.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault(); // Prevent default browser context menu
                    setShowOverlay(session.id);
                    cancelOverlayDismissTimer();
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer">
                      {/* Header with date and expand icon */}
                      <div className="flex items-start gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex-1 min-w-0 break-words">
                          {formatUTCDate(session.date)}
                        </h3>
                        <svg
                          className={`w-5 h-5 transition-transform text-white ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {/* Main content grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left column - Location and workout type */}
                        <div className="space-y-2">
                          <p className="text-white/90 font-medium">
                            {session.location}
                          </p>
                          <p className="text-white/90 text-sm">
                            {session.workoutType}
                          </p>
                        </div>

                        {/* Right column - Metrics */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-white/70 text-sm">⏱️</span>
                              <span className="text-white/70 text-sm">
                                {session.duration} min
                              </span>
                            </div>
                            {session.avgHeartRate && (
                              <div className="flex items-center gap-1">
                                <span className="text-white/70 text-sm">
                                  ❤️
                                </span>
                                <span className="text-white/70 text-sm">
                                  {session.avgHeartRate} bpm
                                </span>
                              </div>
                            )}
                            {session.effort && (
                              <div className="flex items-center gap-1">
                                <span className="text-white/70 text-sm">
                                  💪
                                </span>
                                <span className="text-white/70 text-sm">
                                  {session.effort}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.categories && session.categories.length > 0 ? (
                      session.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSession({
                              workoutId: session.id,
                              date: new Date(session.date)
                                .toISOString()
                                .split("T")[0],
                              categories: session.categories,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            color: "white",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                          }}
                          title="Click to edit categories"
                        >
                          {category.name}
                        </button>
                      ))
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSession({
                            workoutId: session.id,
                            date: new Date(session.date)
                              .toISOString()
                              .split("T")[0],
                            categories: session.categories || [],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                        title="Click to add categories"
                      >
                        <svg
                          className="w-3 h-3"
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
                        Add Category
                      </button>
                    )}
                  </div>

                  {/* Context Menu Overlay */}
                  {showOverlay === session.id && (
                    <div
                      className="edit-overlay absolute top-2 right-2 bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-xl p-2 flex gap-2 z-10 backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={cancelOverlayDismissTimer}
                      onMouseLeave={startOverlayDismissTimer}
                    >
                      <button
                        onClick={() => {
                          setEditingSessionDetails({
                            workoutId: session.id,
                            date: new Date(session.date)
                              .toISOString()
                              .split("T")[0],
                            datetime: session.date,
                            location: session.location,
                            workoutType: session.workoutType,
                          });
                          setShowOverlay(null);
                          cancelOverlayDismissTimer();
                        }}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors touch-manipulation"
                        title="Edit session details"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setEditingSession({
                            workoutId: session.id,
                            date: new Date(session.date)
                              .toISOString()
                              .split("T")[0],
                            categories: session.categories,
                          });
                          setShowOverlay(null);
                          cancelOverlayDismissTimer();
                        }}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg transition-colors touch-manipulation"
                        title="Edit categories"
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
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Delete Workout Session",
                            message: `Delete entire workout session on ${new Date(
                              session.date
                            ).toLocaleDateString()}? This will remove all ${
                              session.exercises.length
                            } exercises in this session.`,
                            confirmText: "Delete Session",
                            cancelText: "Cancel",
                            type: "danger",
                          });

                          if (!confirmed) return;

                          try {
                            // Delete the entire session
                            await deleteWorkoutMutation({
                              variables: { sessionId: session.id },
                            });

                            setShowOverlay(null);
                            cancelOverlayDismissTimer();

                            // Remove workout from store - UI will update automatically
                            removeWorkout(session.id);
                          } catch (error) {
                            console.error(
                              "Failed to delete workout session:",
                              error
                            );
                          }
                        }}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors touch-manipulation"
                        title="Delete session"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-6">
                      {session.exercises && session.exercises.length > 0 ? (
                        session.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exercise.id}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600"
                          >
                            {/* Exercise Header */}
                            <div className="mb-6">
                              {/* Exercise Name */}
                              <div className="mb-3">
                                {editingExercise?.exerciseId === exercise.id ? (
                                  <input
                                    type="text"
                                    value={editingExercise.exerciseName}
                                    onChange={(e) =>
                                      setEditingExercise({
                                        ...editingExercise,
                                        exerciseName: e.target.value,
                                      })
                                    }
                                    onBlur={async () => {
                                      if (editingExercise) {
                                        try {
                                          await updateExerciseName(
                                            editingExercise.exerciseId,
                                            editingExercise.exerciseName
                                          );
                                          setEditingExercise(null);
                                        } catch (error) {
                                          console.error(
                                            "Failed to update exercise name:",
                                            error
                                          );
                                          setEditingExercise(null);
                                        }
                                      }
                                    }}
                                    onKeyDown={async (e) => {
                                      if (
                                        e.key === "Enter" &&
                                        editingExercise
                                      ) {
                                        try {
                                          await updateExerciseName(
                                            editingExercise.exerciseId,
                                            editingExercise.exerciseName
                                          );
                                          setEditingExercise(null);
                                        } catch (error) {
                                          console.error(
                                            "Failed to update exercise name:",
                                            error
                                          );
                                          setEditingExercise(null);
                                        }
                                      } else if (e.key === "Escape") {
                                        setEditingExercise(null);
                                      }
                                    }}
                                    className="text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 focus:outline-none w-full transition-all duration-200 ease-in-out border-b-2 border-blue-500"
                                    autoFocus
                                  />
                                ) : (
                                  <h3
                                    className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border-b-2 border-transparent"
                                    onDoubleClick={() =>
                                      setEditingExercise({
                                        exerciseId: exercise.id,
                                        exerciseName: exercise.exercise,
                                      })
                                    }
                                  >
                                    {exercise.exercise}
                                  </h3>
                                )}
                              </div>

                              {/* Exercise Details */}
                              <div className="space-y-3">
                                {/* Component - Small and Subtle */}
                                {exercise.component && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      Component:
                                    </span>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                                      {exercise.component}
                                    </span>
                                  </div>
                                )}

                                {/* Notes */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <svg
                                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                        />
                                      </svg>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                        Notes
                                      </div>
                                      <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                        {exercise.notes ? (
                                          <button
                                            onClick={() =>
                                              setEditingNotes({
                                                exerciseId: exercise.id,
                                                notes: exercise.notes || "",
                                              })
                                            }
                                            className="text-left w-full cursor-pointer hover:underline"
                                          >
                                            {exercise.notes}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              setEditingNotes({
                                                exerciseId: exercise.id,
                                                notes: "",
                                              })
                                            }
                                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                          >
                                            <svg
                                              className="w-3 h-3"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                              />
                                            </svg>
                                            Add notes
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Workout Sets - Enhanced Design */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  📊 Set Details
                                </h5>
                                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                              </div>

                              {exercise.workoutSets &&
                              exercise.workoutSets.length > 0 ? (
                                <div
                                  className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                                  style={{
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none",
                                  }}
                                >
                                  {exercise.workoutSets.map((set, setIndex) => (
                                    <div
                                      key={set.id}
                                      onClick={() =>
                                        setEditingSet({
                                          setId: set.id,
                                          setNumber: set.setNumber,
                                          weight: set.weight || 0,
                                          reps: set.reps || 0,
                                          exerciseName: exercise.exercise,
                                          equipment:
                                            set.equipment || "dumbbell-both",
                                        })
                                      }
                                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer flex-shrink-0 min-w-[140px]"
                                    >
                                      <div className="text-center">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                                          <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                                            {set.setNumber}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {set.weight} lbs
                                          </div>
                                          <div className="text-sm text-gray-600 dark:text-gray-400">
                                            × {set.reps} reps
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Add Set Card */}
                                  <div
                                    onClick={() => {
                                      // Open modal to add new set
                                      setEditingSet({
                                        setId: "new", // Special ID for new sets
                                        setNumber:
                                          exercise.workoutSets.length + 1,
                                        weight: 0,
                                        reps: 0,
                                        exerciseName: exercise.exercise,
                                        equipment: "dumbbell-both",
                                      });
                                    }}
                                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-2 border-dashed border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex-shrink-0 min-w-[140px]"
                                  >
                                    <div className="text-center">
                                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <svg
                                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                          Add Set
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Click to add
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <div className="text-gray-500 dark:text-gray-400 mb-3">
                                    <p className="text-sm">
                                      No sets recorded yet
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      // Open modal to add first set
                                      setEditingSet({
                                        setId: "new", // Special ID for new sets
                                        setNumber: 1,
                                        weight: 0,
                                        reps: 0,
                                        exerciseName: exercise.exercise,
                                        equipment: "dumbbell-both",
                                      });
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
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
                                    Add First Set
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏋️‍♂️</span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-lg">
                            No exercises recorded for this session
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {hasMoreWorkouts && (
            <div className="mt-6 flex justify-center">
              {/* Auto-load indicator */}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Loading more workouts...
                  </>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    Scroll down to load more workouts automatically
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pagination Stats */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Showing {workouts.length} of {totalWorkouts} workouts
              {selectedCategoryIds.length > 0 && (
                <span className="ml-2">(filtered by category)</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No workouts found. Start by adding your first workout!
          </p>
        </div>
      )}

      {/* Edit Categories Modal */}
      {editingSession && (
        <EditWorkoutSession
          workoutId={editingSession.workoutId}
          date={editingSession.date}
          currentCategories={editingSession.categories}
          onClose={() => setEditingSession(null)}
          onUpdate={() => {
            setEditingSession(null);
            // Refresh workouts to show updated categories
            fetchWorkouts(10, 0, undefined, true);
          }}
        />
      )}

      {/* Edit Session Details Modal for session info */}
      {editingSessionDetails && (
        <EditSessionDetails
          workoutId={editingSessionDetails.workoutId}
          date={editingSessionDetails.date}
          datetime={editingSessionDetails.datetime}
          location={editingSessionDetails.location}
          workoutType={editingSessionDetails.workoutType}
          onClose={() => setEditingSessionDetails(null)}
          onUpdate={() => {
            setEditingSessionDetails(null);
            // Refresh workouts to show updated session details
            fetchWorkouts(10, 0, undefined, true);
          }}
        />
      )}

      {/* Edit Set Modal */}
      {editingSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSet.setId === "new" ? "Add Set" : "Edit Set"}{" "}
                {editingSet.setNumber}
              </h3>
              <button
                onClick={() => setEditingSet(null)}
                disabled={savingSet}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exercise:{" "}
                <span className="font-medium">{editingSet.exerciseName}</span>
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingSet(true);
                try {
                  if (editingSet.setId === "new") {
                    // Create new set
                    // We need to find the exercise ID from the current workout
                    const { workouts } = useWorkoutDataStore.getState();
                    const currentWorkout = workouts.find((workout) =>
                      workout.exercises.some(
                        (exercise) =>
                          exercise.exercise === editingSet.exerciseName
                      )
                    );

                    if (currentWorkout) {
                      const exercise = currentWorkout.exercises.find(
                        (ex) => ex.exercise === editingSet.exerciseName
                      );
                      if (exercise) {
                        await createSet(
                          exercise.id,
                          editingSet.setNumber,
                          editingSet.weight,
                          editingSet.reps,
                          editingSet.equipment
                        );
                        setEditingSet(null);
                      }
                    }
                  } else {
                    // Update existing set using the store (now saves to database)
                    await updateSet(
                      editingSet.setId,
                      editingSet.weight,
                      editingSet.reps,
                      editingSet.equipment
                    );
                    setEditingSet(null);
                  }
                } catch (error) {
                  console.error("Failed to update set:", error);
                  // You could add a toast notification here
                } finally {
                  setSavingSet(false);
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipment
                  </label>
                  <select
                    value={editingSet.equipment}
                    onChange={(e) =>
                      setEditingSet({
                        ...editingSet,
                        equipment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="dumbbell-both">Dumbbell (both hands)</option>
                    <option value="dumbbell-single">
                      Dumbbell (single hand)
                    </option>
                    <option value="kettlebell">Kettlebell</option>
                    <option value="medicineball">Medicine Ball</option>
                    <option value="slam-ball">Slam Ball</option>
                    <option value="exercise-bar">Exercise Bar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={editingSet.weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for better UX when typing
                      const weight = value === "" ? 0 : parseFloat(value) || 0;
                      setEditingSet({
                        ...editingSet,
                        weight: weight,
                      });
                    }}
                    onFocus={(e) => {
                      // Select all text when focusing to make it easier to replace
                      e.target.select();
                    }}
                    onKeyDown={(e) => {
                      // If user starts typing a number and current value is 0, clear the field
                      if (editingSet.weight === 0 && /[1-9]/.test(e.key)) {
                        e.preventDefault();
                        setEditingSet({
                          ...editingSet,
                          weight: parseFloat(e.key) || 0,
                        });
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        // Trigger form submission
                        const form = e.currentTarget.closest("form");
                        if (form) {
                          form.requestSubmit();
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reps
                  </label>
                  <input
                    type="number"
                    value={editingSet.reps}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for better UX when typing
                      const reps = value === "" ? 0 : parseInt(value) || 0;
                      setEditingSet({
                        ...editingSet,
                        reps: reps,
                      });
                    }}
                    onFocus={(e) => {
                      // Select all text when focusing to make it easier to replace
                      e.target.select();
                    }}
                    onKeyDown={(e) => {
                      // If user starts typing a number and current value is 0, clear the field
                      if (editingSet.reps === 0 && /[1-9]/.test(e.key)) {
                        e.preventDefault();
                        setEditingSet({
                          ...editingSet,
                          reps: parseInt(e.key) || 0,
                        });
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        // Trigger form submission
                        const form = e.currentTarget.closest("form");
                        if (form) {
                          form.requestSubmit();
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {editingSet.setId !== "new" && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (editingSet.setId !== "new") {
                        try {
                          await deleteSet(editingSet.setId);
                          setEditingSet(null);
                        } catch (error) {
                          console.error("Failed to delete set:", error);
                        }
                      }
                    }}
                    disabled={savingSet}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                )}
                <button
                  onClick={() => setEditingSet(null)}
                  disabled={savingSet}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSet}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSet ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={notesModalRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Notes
              </h3>
              <button
                onClick={() => setEditingNotes(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingNotes(true);
                try {
                  await updateExerciseNotes(
                    editingNotes.exerciseId,
                    editingNotes.notes
                  );
                  setEditingNotes(null);
                } catch (error) {
                  console.error("Failed to update notes:", error);
                } finally {
                  setSavingNotes(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  ref={notesTextareaRef}
                  value={editingNotes.notes}
                  onChange={(e) =>
                    setEditingNotes({
                      ...editingNotes,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Add your notes here..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-dashlane-ignore="true"
                  data-bitwarden-watching="false"
                  name="notes-textarea"
                  id="notes-textarea"
                  readOnly={false}
                  inputMode="text"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingNotes(null)}
                  disabled={savingNotes}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Filter Dialog */}
      <CategoryFilterDialog
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        onCategoryChange={setSelectedCategories}
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
      />
    </div>
  );
}
