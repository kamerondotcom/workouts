"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apolloClient } from "../../lib/apollo";
import { gql } from "@apollo/client";

// Types
export interface WorkoutSession {
  id: string;
  date: string;
  location: string;
  workoutType: string;
  duration: number;
  activeCalories: number;
  totalCalories: number;
  avgHeartRate: number;
  effort: number;
  sessionName?: string;
  notes?: string;
  exercises: WorkoutExercise[];
  categories: Category[];
}

export interface WorkoutExercise {
  id: string;
  sessionId: string;
  component: string;
  exercise: string;
  notes?: string;
  orderInSession: number;
  isWeightTracked: boolean;
  weight?: number;
  reps?: number;
  sets?: number;
  workoutSets: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

// GraphQL Queries
const GET_WORKOUT_SESSIONS = gql`
  query GetWorkoutSessions($limit: Int, $offset: Int, $categoryId: String) {
    workoutSessions(limit: $limit, offset: $offset, categoryId: $categoryId) {
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
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      color
    }
  }
`;

// Store State
interface WorkoutState {
  // Data
  workouts: WorkoutSession[];
  categories: Category[];
  allWorkouts: WorkoutSession[];

  // Loading states
  loading: boolean;
  loadingMore: boolean;

  // Pagination
  hasMoreWorkouts: boolean;
  offset: number;

  // UI state
  selectedCategoryIds: string[];
  collapsedSessions: Set<string>;
  hasInitialized: boolean;

  // Actions
  fetchWorkouts: (categoryId?: string) => Promise<void>;
  loadMoreWorkouts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  refetchWorkouts: () => Promise<void>;
  toggleSession: (date: string) => void;
  setSelectedCategories: (categoryIds: string[]) => void;
  initializeCollapsedSessions: () => void;
  addWorkoutToCollapsed: (date: string) => void;
  resetStore: () => void;
}

// Initial state
const initialState = {
  workouts: [],
  categories: [],
  allWorkouts: [],
  loading: false,
  loadingMore: false,
  hasMoreWorkouts: true,
  offset: 0,
  selectedCategoryIds: [],
  collapsedSessions: new Set<string>(),
  hasInitialized: false,
};

export const useWorkoutStore = create<WorkoutState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchWorkouts: async (categoryId?: string) => {
        set({ loading: true });
        try {
          // Temporarily disabled to fix pagination issue
          return;
          const result = await apolloClient.query({
            query: GET_WORKOUT_SESSIONS,
            variables: {
              limit: 5,
              offset: 0,
              categoryId: categoryId || null,
            },
            fetchPolicy: "cache-first",
          });

          const workouts = (result.data as any).workoutSessions || [];
          set({
            workouts,
            allWorkouts: workouts,
            hasMoreWorkouts: workouts.length === 5,
            offset: 5,
            loading: false,
          });
        } catch (error) {
          console.error("Error fetching workouts:", error);
          set({ loading: false });
        }
      },

      loadMoreWorkouts: async () => {
        const {
          loadingMore,
          hasMoreWorkouts,
          allWorkouts,
          selectedCategoryIds,
          offset,
        } = get();
        if (loadingMore || !hasMoreWorkouts) return;

        set({ loadingMore: true });
        try {
          const result = await apolloClient.query({
            query: GET_WORKOUT_SESSIONS,
            variables: {
              limit: 5,
              offset,
              categoryId:
                selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null,
            },
            fetchPolicy: "network-only",
          });

          const newWorkouts = (result.data as any).workoutSessions || [];
          if (newWorkouts.length > 0) {
            const updatedWorkouts = [...allWorkouts, ...newWorkouts];
            set({
              allWorkouts: updatedWorkouts,
              hasMoreWorkouts: newWorkouts.length === 5,
              offset: offset + 5,
              loadingMore: false,
            });

            // Add new workout dates to collapsed sessions
            const newDates = newWorkouts.map(
              (workout: any) =>
                new Date(workout.date).toISOString().split("T")[0]
            );
            const { collapsedSessions } = get();
            const updatedCollapsed = new Set(collapsedSessions);
            newDates.forEach((date: string) => updatedCollapsed.add(date));
            set({ collapsedSessions: updatedCollapsed });
          } else {
            set({ hasMoreWorkouts: false, loadingMore: false });
          }
        } catch (error) {
          console.error("Error loading more workouts:", error);
          set({ loadingMore: false });
        }
      },

      fetchCategories: async () => {
        try {
          const result = await apolloClient.query({
            query: GET_CATEGORIES,
            fetchPolicy: "cache-first",
          });

          set({ categories: (result.data as any).categories || [] });
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      },

      refetchWorkouts: async () => {
        const { selectedCategoryIds } = get();
        const categoryId =
          selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined;
        await get().fetchWorkouts(categoryId);
      },

      toggleSession: (date: string) => {
        const { collapsedSessions } = get();
        const next = new Set(collapsedSessions);
        if (next.has(date)) {
          next.delete(date);
        } else {
          next.add(date);
        }
        set({ collapsedSessions: next });
      },

      setSelectedCategories: (categoryIds: string[]) => {
        set({ selectedCategoryIds: categoryIds });
        // Refetch workouts with new category filter
        get().fetchWorkouts(
          categoryIds.length > 0 ? categoryIds[0] : undefined
        );
      },

      initializeCollapsedSessions: () => {
        const { allWorkouts, hasInitialized } = get();
        if (!hasInitialized && allWorkouts.length > 0) {
          const allDates = allWorkouts.map(
            (workout) => new Date(workout.date).toISOString().split("T")[0]
          );
          set({
            collapsedSessions: new Set(allDates),
            hasInitialized: true,
          });
        }
      },

      addWorkoutToCollapsed: (date: string) => {
        const { collapsedSessions } = get();
        const next = new Set(collapsedSessions);
        next.add(date);
        set({ collapsedSessions: next });
      },

      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: "workout-store",
    }
  )
);
