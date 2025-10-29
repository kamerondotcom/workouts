export const typeDefs = `#graphql
  scalar DateTime

  type User {
    id: String!
    email: String!
    name: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type ChangePasswordResult {
    success: Boolean!
    message: String!
  }

  type UpdateUserNameResult {
    success: Boolean!
    message: String!
    user: User!
  }

  type Category {
    id: String
    name: String
    color: String
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WorkoutSet {
    id: String!
    setNumber: Int!
    weight: Float!
    reps: Int!
    equipment: String!
    createdAt: DateTime!
  }

  type CacheMetadata {
    key: String!
    status: String!
    timestamp: String!
    ttl: Int!
    totalExercises: Int
    filteredCount: Int
    returnedCount: Int
  }

  type CategoriesResponse {
    categories: [Category!]!
    cache: CacheMetadata!
  }

  type SearchExercisesResponse {
    exercises: [WorkoutExercise!]!
    cache: CacheMetadata!
  }

  type WorkoutSessionsResponse {
    sessions: [WorkoutSession!]!
    cache: CacheMetadata!
  }

  type WorkoutSession {
    id: String!
    userId: String!
    user: User!
    date: DateTime!
    location: String!
    workoutType: String!
    duration: Int!
    activeCalories: Int!
    totalCalories: Int!
    avgHeartRate: Int!
    effort: Int!
    sessionName: String
    notes: String
    exercises: [WorkoutExercise!]!
    categories: [Category!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WorkoutExercise {
    id: String!
    sessionId: String!
    component: String!
    exercise: String!
    notes: String
    orderInSession: Int!
    isWeightTracked: Boolean!
    weight: Float
    reps: Int
    sets: Int
    workoutSets: [WorkoutSet!]!
    session: WorkoutSession
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input WorkoutSetInput {
    setNumber: Int!
    weight: Float!
    reps: Int!
    equipment: String
  }

  type Query {
    workoutSessions(limit: Int, offset: Int, categoryId: String, userId: String): WorkoutSessionsResponse!
    workoutSession(id: String!): WorkoutSession
    workoutSessionsByDate(date: String!): [WorkoutSession!]!
    workoutSessionsByLocation(location: String!): [WorkoutSession!]!
    workoutSessionsByType(workoutType: String!): [WorkoutSession!]!
    workoutSessionsCount(categoryId: String, userId: String): Int!
    allWorkoutDates: [String!]!
    allLocations: [String!]!
    allWorkoutTypes: [String!]!
    
    categories: CategoriesResponse!
    category(id: String!): Category
    searchExercises(searchQuery: String!, categoryIds: [String!], limit: Int, offset: Int): SearchExercisesResponse!
  }

  type Mutation {
    createWorkoutSession(
      date: String!
      location: String!
      workoutType: String!
      duration: Int!
      activeCalories: Int!
      totalCalories: Int!
      avgHeartRate: Int!
      effort: Int!
      sessionName: String
      notes: String
      categoryIds: [String!]
    ): WorkoutSession!

    updateWorkoutSession(
      id: String!
      date: String
      location: String
      workoutType: String
      duration: Int
      activeCalories: Int
      totalCalories: Int
      avgHeartRate: Int
      effort: Int
      sessionName: String
      notes: String
      categoryIds: [String!]
    ): WorkoutSession!

    deleteWorkoutSession(sessionId: String!): Int!

    createWorkoutExercise(
      sessionId: String!
      component: String!
      exercise: String!
      notes: String
      orderInSession: Int
      isWeightTracked: Boolean
      weight: Float
      reps: Int
      sets: Int
      workoutSets: [WorkoutSetInput!]
    ): WorkoutExercise!

    updateWorkoutExercise(
      id: String!
      component: String
      exercise: String
      notes: String
      orderInSession: Int
      isWeightTracked: Boolean
      weight: Float
      reps: Int
      sets: Int
      workoutSets: [WorkoutSetInput!]
    ): WorkoutExercise!

    deleteWorkoutExercise(id: String!): WorkoutExercise

    updateWorkoutSessionCategories(sessionId: String!, categoryIds: [String!]!): Int!
    
    updateWorkoutSessionDateTime(
      sessionId: String!
      newDate: String!
      newTime: String!
      location: String
      workoutType: String
    ): WorkoutSession!
    
    reorderWorkoutExercises(exerciseIds: [String!]!): Boolean!
    updateExerciseComponentName(exerciseId: String!, newName: String!): WorkoutExercise!
    updateExerciseName(exerciseId: String!, newName: String!): WorkoutExercise!
    updateExerciseNotes(exerciseId: String!, notes: String!): WorkoutExercise!
    updateWorkoutSet(setId: String!, weight: Float!, reps: Int!, equipment: String): WorkoutSet!
    createWorkoutSet(exerciseId: String!, setNumber: Int!, weight: Float!, reps: Int!, equipment: String): WorkoutSet!
    deleteWorkoutSet(setId: String!): Int!
    
    createCategory(name: String!, color: String, description: String): Category!
    updateCategory(id: String!, name: String, color: String, description: String): Category!
    deleteCategory(id: String!): Category
    
    # User authentication
    createUser(email: String!, name: String, password: String!): User!
    loginUser(email: String!, password: String!): AuthPayload!
    changePassword(currentPassword: String!, newPassword: String!): ChangePasswordResult!
    updateUserName(name: String!): UpdateUserNameResult!
  }
`;
