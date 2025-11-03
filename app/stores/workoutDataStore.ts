import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apolloClient } from "@/lib/apollo";
import { gql } from "@apollo/client";

// GraphQL Queries
const GET_WORKOUT_SESSIONS = gql`
  query GetWorkoutSessions($limit: Int, $offset: Int, $categoryId: String) {
    workoutSessions(limit: $limit, offset: $offset, categoryId: $categoryId) {
      sessions {
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
        createdAt
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
          createdAt
          workoutSets {
            id
            setNumber
            weight
            reps
            equipment
            createdAt
          }
        }
        categories {
          id
          name
          color
          description
        }
      }
      cache {
        key
        status
        timestamp
        ttl
      }
    }
  }
`;

const GET_WORKOUT_SESSIONS_COUNT = gql`
  query GetWorkoutSessionsCount($categoryId: String) {
    workoutSessionsCount(categoryId: $categoryId)
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      categories {
        id
        name
        color
        description
        createdAt
      }
      cache {
        key
        status
        timestamp
        ttl
      }
    }
  }
`;

const UPDATE_WORKOUT_SET = gql`
  mutation UpdateWorkoutSet(
    $setId: String!
    $weight: Float!
    $reps: Int!
    $equipment: String
  ) {
    updateWorkoutSet(
      setId: $setId
      weight: $weight
      reps: $reps
      equipment: $equipment
    ) {
      id
      setNumber
      weight
      reps
      equipment
      createdAt
    }
  }
`;

const CREATE_WORKOUT_SET = gql`
  mutation CreateWorkoutSet(
    $exerciseId: String!
    $setNumber: Int!
    $weight: Float!
    $reps: Int!
    $equipment: String
  ) {
    createWorkoutSet(
      exerciseId: $exerciseId
      setNumber: $setNumber
      weight: $weight
      reps: $reps
      equipment: $equipment
    ) {
      id
      setNumber
      weight
      reps
      equipment
      createdAt
    }
  }
`;

const DELETE_WORKOUT_SET = gql`
  mutation DeleteWorkoutSet($setId: String!) {
    deleteWorkoutSet(setId: $setId)
  }
`;

const UPDATE_EXERCISE_NAME = gql`
  mutation UpdateExerciseName($exerciseId: String!, $newName: String!) {
    updateExerciseName(exerciseId: $exerciseId, newName: $newName) {
      id
      exercise
      component
      notes
      orderInSession
      isWeightTracked
      weight
      reps
      sets
      createdAt
    }
  }
`;

const UPDATE_EXERCISE_NOTES = gql`
  mutation UpdateExerciseNotes($exerciseId: String!, $notes: String!) {
    updateExerciseNotes(exerciseId: $exerciseId, notes: $notes) {
      id
      exercise
      component
      notes
      orderInSession
      isWeightTracked
      weight
      reps
      sets
      createdAt
    }
  }
`;

const SEARCH_EXERCISES = gql`
  query SearchExercises(
    $searchQuery: String!
    $categoryIds: [String!]
    $limit: Int
    $offset: Int
  ) {
    searchExercises(
      searchQuery: $searchQuery
      categoryIds: $categoryIds
      limit: $limit
      offset: $offset
    ) {
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
        createdAt
        workoutSets {
          id
          setNumber
          weight
          reps
          equipment
          createdAt
        }
        session {
          id
          date
          location
          workoutType
          sessionName
          categories {
            id
            name
            color
            description
          }
        }
      }
      cache {
        key
        status
        timestamp
        ttl
      }
    }
  }
`;

// Types
interface WorkoutSession {
  id: string;
  date: string;
  location: string;
  workoutType: string;
  duration?: number;
  activeCalories?: number;
  totalCalories?: number;
  avgHeartRate?: number;
  effort?: string;
  sessionName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutExercise[];
  categories: Category[];
}

interface WorkoutExercise {
  id: string;
  component: string;
  exercise: string;
  notes?: string;
  orderInSession: number;
  isWeightTracked: boolean;
  weight?: number;
  reps?: number;
  sets?: number;
  createdAt: string;
  updatedAt: string;
  workoutSets: WorkoutSet[];
  session?: {
    id: string;
    date: string;
    location?: string;
    workoutType?: string;
    sessionName?: string;
    categories?: Category[];
  };
}

interface WorkoutSet {
  id: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  equipment?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CacheMetadata {
  key: string;
  status: "HIT" | "MISS";
  timestamp: string;
  ttl: number;
}

interface WorkoutDataState {
  // Data
  workouts: WorkoutSession[];
  categories: Category[];
  searchResults: WorkoutExercise[];
  totalWorkouts: number;

  // Loading states
  workoutsLoading: boolean;
  categoriesLoading: boolean;
  searchLoading: boolean;
  countLoading: boolean;

  // Error states
  workoutsError: string | null;
  categoriesError: string | null;
  searchError: string | null;
  countError: string | null;

  // Cache metadata
  workoutsCache: CacheMetadata | null;
  categoriesCache: CacheMetadata | null;
  searchCache: CacheMetadata | null;

  // Pagination
  currentOffset: number;
  hasMoreWorkouts: boolean;

  // Search
  searchQuery: string;
  selectedCategoryIds: string[];

  // Actions
  fetchWorkouts: (
    limit?: number,
    offset?: number,
    categoryId?: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSearchResults: (query: string, categoryIds?: string[]) => Promise<void>;
  fetchWorkoutCount: (categoryId?: string) => Promise<void>;
  loadMoreWorkouts: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategories: (categoryIds: string[]) => Promise<void>;
  clearSearch: () => void;
  removeWorkout: (sessionId: string) => void;
  updateSet: (
    setId: string,
    weight: number,
    reps: number,
    equipment?: string
  ) => Promise<void>;
  createSet: (
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
    equipment?: string
  ) => Promise<void>;
  updateExerciseName: (exerciseId: string, newName: string) => Promise<void>;
  updateExerciseNotes: (exerciseId: string, notes: string) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  reset: () => void;
}

export const useWorkoutDataStore = create<WorkoutDataState>()(
  devtools(
    (set, get) => ({
      // Initial state
      workouts: [],
      categories: [],
      searchResults: [],
      totalWorkouts: 0,

      workoutsLoading: false,
      categoriesLoading: false,
      searchLoading: false,
      countLoading: false,

      workoutsError: null,
      categoriesError: null,
      searchError: null,
      countError: null,

      workoutsCache: null,
      categoriesCache: null,
      searchCache: null,

      currentOffset: 0,
      hasMoreWorkouts: true,

      searchQuery: "",
      selectedCategoryIds: [],

      // Actions
      fetchWorkouts: async (
        limit = 10,
        offset = 0,
        categoryId?: string,
        forceRefresh = false
      ) => {
        set({ workoutsLoading: true, workoutsError: null });

        try {
          // Use network-only for forced refresh (like after CSV import)
          const fetchPolicy = forceRefresh ? "network-only" : "cache-first";

          // Fetch both workouts and total count
          const [workoutsResult, countResult] = await Promise.all([
            apolloClient.query({
              query: GET_WORKOUT_SESSIONS,
              variables: { limit, offset, categoryId },
              fetchPolicy,
              errorPolicy: "all",
            }),
            apolloClient.query({
              query: GET_WORKOUT_SESSIONS_COUNT,
              variables: { categoryId },
              fetchPolicy,
              errorPolicy: "all",
            }),
          ]);

          const { data: workoutsData } = workoutsResult;
          const { data: countData } = countResult;

          const workouts =
            (workoutsData as any)?.workoutSessions?.sessions || [];
          const cache = (workoutsData as any)?.workoutSessions?.cache;
          const totalCount = (countData as any)?.workoutSessionsCount || 0;
          const hasMore = offset + workouts.length < totalCount;

          set({
            workouts,
            totalWorkouts: totalCount,
            workoutsLoading: false,
            workoutsCache: cache,
            currentOffset: offset,
            hasMoreWorkouts: hasMore,
          });
        } catch (error) {
          console.error("🏋️ Store - Error fetching workouts:", error);
          set({
            workoutsLoading: false,
            workoutsError:
              error instanceof Error
                ? error.message
                : "Failed to fetch workouts",
          });
        }
      },

      fetchCategories: async () => {
        set({ categoriesLoading: true, categoriesError: null });

        try {
          const { data } = await apolloClient.query({
            query: GET_CATEGORIES,
            fetchPolicy: "network-only",
            errorPolicy: "all",
          });

          const categories = (data as any)?.categories?.categories || [];
          const cache = (data as any)?.categories?.cache;

          set({
            categories,
            categoriesLoading: false,
            categoriesCache: cache,
          });
        } catch (error) {
          console.error("📂 Store - Error fetching categories:", error);
          set({
            categoriesLoading: false,
            categoriesError:
              error instanceof Error
                ? error.message
                : "Failed to fetch categories",
          });
        }
      },

      fetchSearchResults: async (query: string, categoryIds: string[] = []) => {
        if (!query.trim()) {
          set({ searchResults: [], searchLoading: false });
          return;
        }

        set({ searchLoading: true, searchError: null });

        try {
          const { data } = await apolloClient.query({
            query: SEARCH_EXERCISES,
            variables: {
              searchQuery: query,
              categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
              limit: 20,
              offset: 0,
            },
            fetchPolicy: "network-only",
            errorPolicy: "all",
          });

          const response = (data as any)?.searchExercises;
          const exercises = response?.exercises || [];
          const cacheMetadata = response?.cache;

          set({
            searchResults: exercises,
            searchLoading: false,
            searchCache: cacheMetadata,
          });
        } catch (error) {
          console.error("🔍 Store - Error searching:", error);
          set({
            searchLoading: false,
            searchError:
              error instanceof Error ? error.message : "Search failed",
          });
        }
      },

      fetchWorkoutCount: async (categoryId?: string) => {
        set({ countLoading: true, countError: null });

        try {
          const { data } = await apolloClient.query({
            query: GET_WORKOUT_SESSIONS_COUNT,
            variables: { categoryId },
            fetchPolicy: "network-only",
            errorPolicy: "all",
          });

          const count = (data as any)?.workoutSessionsCount || 0;

          set({
            totalWorkouts: count,
            countLoading: false,
          });
        } catch (error) {
          console.error("📊 Store - Error fetching count:", error);
          set({
            countLoading: false,
            countError:
              error instanceof Error ? error.message : "Failed to fetch count",
          });
        }
      },

      loadMoreWorkouts: async () => {
        const {
          currentOffset,
          hasMoreWorkouts,
          selectedCategoryIds,
          totalWorkouts,
          workouts,
        } = get();

        if (!hasMoreWorkouts) {
          return;
        }

        const categoryId =
          selectedCategoryIds.length === 1 ? selectedCategoryIds[0] : undefined;
        const newOffset = currentOffset + 10;

        // Don't set loading state for loadMore to prevent flashing
        // set({ workoutsLoading: true });

        try {
          const { data, error } = await apolloClient.query({
            query: GET_WORKOUT_SESSIONS,
            variables: { limit: 10, offset: newOffset, categoryId },
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          });

          const newWorkouts = (data as any)?.workoutSessions?.sessions || [];
          const currentWorkouts = get().workouts;

          const totalLoaded = currentWorkouts.length + newWorkouts.length;
          const hasMore = totalLoaded < totalWorkouts;

          set({
            workouts: [...currentWorkouts, ...newWorkouts],
            currentOffset: newOffset,
            hasMoreWorkouts: hasMore,
          });
        } catch (error) {
          console.error("🔄 Store - Error loading more workouts:", error);
          set({
            workoutsError:
              error instanceof Error
                ? error.message
                : "Failed to load more workouts",
          });
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setSelectedCategories: async (categoryIds: string[]) => {
        set({ selectedCategoryIds: categoryIds });

        // Refetch workouts with new category filter
        const categoryId =
          categoryIds.length === 1 ? categoryIds[0] : undefined;
        await get().fetchWorkouts(10, 0, categoryId, true);
      },

      clearSearch: () => {
        set({
          searchQuery: "",
          searchResults: [],
          searchError: null,
        });
      },

      removeWorkout: (sessionId: string) => {
        const { workouts, totalWorkouts, currentOffset } = get();
        const updatedWorkouts = workouts.filter(
          (workout) => workout.id !== sessionId
        );
        const newTotalWorkouts = Math.max(0, totalWorkouts - 1);
        const totalLoaded = currentOffset + updatedWorkouts.length;
        const hasMore = totalLoaded < newTotalWorkouts;

        set({
          workouts: updatedWorkouts,
          totalWorkouts: newTotalWorkouts,
          hasMoreWorkouts: hasMore,
        });
      },

      updateSet: async (
        setId: string,
        weight: number,
        reps: number,
        equipment?: string
      ) => {
        try {

          // Update in database first
          const { data } = await apolloClient.mutate({
            mutation: UPDATE_WORKOUT_SET,
            variables: { setId, weight, reps, equipment },
          });

          if ((data as any)?.updateWorkoutSet) {
            // Update local store
            const { workouts } = get();
            const updatedWorkouts = workouts.map((workout) => ({
              ...workout,
              exercises: workout.exercises.map((exercise) => ({
                ...exercise,
                workoutSets: exercise.workoutSets.map((set) =>
                  set.id === setId ? { ...set, weight, reps } : set
                ),
              })),
            }));

            set({ workouts: updatedWorkouts });
          }
        } catch (error) {
          console.error("Failed to update workout set:", error);
          throw error;
        }
      },

      createSet: async (
        exerciseId: string,
        setNumber: number,
        weight: number,
        reps: number,
        equipment?: string
      ) => {
        try {
          // Create in database first
          const { data } = await apolloClient.mutate({
            mutation: CREATE_WORKOUT_SET,
            variables: { exerciseId, setNumber, weight, reps, equipment },
          });

          if ((data as any)?.createWorkoutSet) {
            // Update local store
            const { workouts } = get();
            const updatedWorkouts = workouts.map((workout) => ({
              ...workout,
              exercises: workout.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      workoutSets: [
                        ...exercise.workoutSets,
                        (data as any).createWorkoutSet,
                      ],
                    }
                  : exercise
              ),
            }));

            set({ workouts: updatedWorkouts });
          }
        } catch (error) {
          console.error("Failed to create workout set:", error);
          throw error;
        }
      },

      updateExerciseName: async (exerciseId: string, newName: string) => {
        try {
          // Update in database first
          const { data } = await apolloClient.mutate({
            mutation: UPDATE_EXERCISE_NAME,
            variables: { exerciseId, newName },
          });

          if ((data as any)?.updateExerciseName) {
            // Update local store
            const { workouts } = get();
            const updatedWorkouts = workouts.map((workout) => ({
              ...workout,
              exercises: workout.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? { ...exercise, exercise: newName }
                  : exercise
              ),
            }));

            set({ workouts: updatedWorkouts });
          }
        } catch (error) {
          console.error("Failed to update exercise name:", error);
          throw error;
        }
      },

      updateExerciseNotes: async (exerciseId: string, notes: string) => {
        try {
          // Update in database first
          const { data } = await apolloClient.mutate({
            mutation: UPDATE_EXERCISE_NOTES,
            variables: { exerciseId, notes },
          });

          if ((data as any)?.updateExerciseNotes) {
            // Update local store
            const { workouts } = get();
            const updatedWorkouts = workouts.map((workout) => ({
              ...workout,
              exercises: workout.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? { ...exercise, notes: notes }
                  : exercise
              ),
            }));

            set({ workouts: updatedWorkouts });
          }
        } catch (error) {
          console.error("Failed to update exercise notes:", error);
          throw error;
        }
      },

      deleteSet: async (setId: string) => {
        try {
          // Delete in database first
          await apolloClient.mutate({
            mutation: DELETE_WORKOUT_SET,
            variables: { setId },
          });

          // Update local store
          const { workouts } = get();
          const updatedWorkouts = workouts.map((workout) => ({
            ...workout,
            exercises: workout.exercises.map((exercise) => ({
              ...exercise,
              workoutSets: exercise.workoutSets.filter(
                (set) => set.id !== setId
              ),
            })),
          }));

          set({ workouts: updatedWorkouts });
        } catch (error) {
          console.error("Failed to delete workout set:", error);
          throw error;
        }
      },

      reset: () => {
        set({
          workouts: [],
          categories: [],
          searchResults: [],
          totalWorkouts: 0,
          workoutsLoading: false,
          categoriesLoading: false,
          searchLoading: false,
          countLoading: false,
          workoutsError: null,
          categoriesError: null,
          searchError: null,
          countError: null,
          workoutsCache: null,
          categoriesCache: null,
          searchCache: null,
          currentOffset: 0,
          hasMoreWorkouts: true,
          searchQuery: "",
          selectedCategoryIds: [],
        });
      },
    }),
    {
      name: "workout-data-store",
    }
  )
);
