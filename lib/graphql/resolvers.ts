import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import bcrypt from "bcrypt";
import { redisCache } from "@/lib/redis-cache";

// Authentication context type
interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export const resolvers = {
  WorkoutSession: {
    exercises: async (parent: any, args: any, context: any, info: any) => {
      // Use DataLoader pattern to batch exercise queries
      if (parent.exercises) {
        return parent.exercises;
      }
      return await prisma.workoutExercise.findMany({
        where: { sessionId: parent.id },
        orderBy: { orderInSession: "asc" },
        include: {
          workoutSets: {
            orderBy: { setNumber: "asc" },
          },
        },
      });
    },
    categories: async (parent: any, args: any, context: any, info: any) => {
      try {
        // Use DataLoader pattern to batch category queries
        if (parent.categories) {
          return parent.categories;
        }

        const workoutSessionCategories =
          await prisma.workoutSessionCategory.findMany({
            where: { sessionId: parent.id },
            include: {
              category: true,
            },
          });

        // Map to categories and filter out nulls and invalid categories
        const categories = workoutSessionCategories
          .map((wsc) => wsc.category)
          .filter(
            (category) =>
              category !== null &&
              category !== undefined &&
              category.id !== null &&
              category.id !== undefined &&
              category.name !== null &&
              category.name !== undefined &&
              category.color !== null &&
              category.color !== undefined
          );

        return categories;
      } catch (error) {
        console.error(
          `Error in categories resolver for session ${parent.id}:`,
          error
        );
        return []; // Return empty array instead of throwing
      }
    },
  },

  WorkoutExercise: {
    workoutSets: async (parent: any) => {
      return await prisma.workoutSet.findMany({
        where: { exerciseId: parent.id },
        orderBy: { setNumber: "asc" },
      });
    },
    session: async (parent: any) => {
      return await prisma.workoutSession.findUnique({
        where: { id: parent.sessionId },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
    },
  },

  Query: {
    workoutSessions: async (
      _: any,
      {
        limit = 50,
        offset = 0,
        categoryId,
      }: {
        limit?: number;
        offset?: number;
        categoryId?: string;
      },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // Check Redis cache first
      const cacheKey = `${context.user.id}:workouts:${limit}:${offset}:${
        categoryId || "all"
      }`;
      console.log("🔍 Cache key:", cacheKey);
      // Check Redis cache first
      const cachedWorkouts = await redisCache.getUserWorkoutsPaginated(
        context.user.id,
        limit,
        offset,
        categoryId
      );

      console.log(
        "🔍 Cache check - cachedWorkouts:",
        cachedWorkouts ? cachedWorkouts.length : "null",
        "limit:",
        limit
      );

      if (cachedWorkouts) {
        // Transform cached categories to flattened structure
        const transformedCachedWorkouts = cachedWorkouts.map((workout: any) => {
          const userCategories =
            workout.categories?.map((cat: any) => {
              return {
                id: cat.category?.id || cat.id,
                name: cat.category?.name || cat.name,
                color: cat.category?.color || cat.color,
              };
            }) || [];

          return {
            ...workout,
            categories: userCategories,
          };
        });

        const cacheMetadata = {
          key: cacheKey,
          status: "HIT",
          timestamp: new Date().toISOString(),
          ttl: 3600000,
          totalExercises: transformedCachedWorkouts.length,
          filteredCount: transformedCachedWorkouts.length,
          returnedCount: transformedCachedWorkouts.length,
        };

        return {
          sessions: transformedCachedWorkouts,
          cache: cacheMetadata,
        };
      }

      // Fetch from database if not in cache
      console.log(
        "🔍 DB Query - limit:",
        limit,
        "offset:",
        offset,
        "userId:",
        context.user.id
      );
      const workouts = await prisma.workoutSession.findMany({
        take: limit,
        skip: offset,
        where: {
          userId: context.user.id, // Filter by authenticated user
          ...(categoryId && {
            categories: {
              some: {
                categoryId: categoryId,
              },
            },
          }),
        },
        orderBy: {
          date: "desc",
        },
        include: {
          exercises: {
            include: {
              workoutSets: {
                orderBy: { setNumber: "asc" }, // Order sets efficiently
              },
            },
            orderBy: { orderInSession: "asc" },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
      console.log(
        "🔍 DB Result - workouts count:",
        workouts.length,
        "limit was:",
        limit
      );

      // Transform categories to flattened structure
      const transformedWorkouts = workouts.map((workout) => {
        const userCategories =
          workout.categories?.map((cat: any) => {
            return {
              id: cat.category?.id,
              name: cat.category?.name,
              color: cat.category?.color,
            };
          }) || [];

        return {
          ...workout,
          categories: userCategories,
        };
      });

      // Cache the results
      await redisCache.setUserWorkoutsPaginated(
        context.user.id,
        limit,
        offset,
        categoryId,
        transformedWorkouts
      );

      const cacheMetadata = {
        key: cacheKey,
        status: "MISS",
        timestamp: new Date().toISOString(),
        ttl: 3600000,
        totalExercises: transformedWorkouts.length,
        filteredCount: transformedWorkouts.length,
        returnedCount: transformedWorkouts.length,
      };

      return {
        sessions: transformedWorkouts,
        cache: cacheMetadata,
      };
    },

    workoutSessionsCount: async (
      _: any,
      { categoryId }: { categoryId?: string },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      console.log(
        "workoutSessionsCount called with categoryId:",
        categoryId,
        "userId:",
        context.user.id
      );
      const whereClause = {
        userId: context.user.id, // Filter by authenticated user
        ...(categoryId && {
          categories: {
            some: {
              categoryId: categoryId,
            },
          },
        }),
      };

      console.log("Count where clause:", whereClause);
      const count = await prisma.workoutSession.count({
        where: whereClause,
      });
      console.log("Count result:", count);
      return count;
    },

    workoutSession: async (_: any, { id }: { id: string }) => {
      return await prisma.workoutSession.findUnique({
        where: { id },
        include: {
          exercises: {
            include: {
              workoutSets: {
                orderBy: { setNumber: "asc" }, // Order sets efficiently
              },
            },
            orderBy: { orderInSession: "asc" },
          },
          // Remove categories from direct query - let the resolver handle it
        },
      });
    },

    workoutSessionsByDate: async (_: any, { date }: { date: string }) => {
      // Parse date with timezone awareness to avoid off-by-one day issues
      const startDate = new Date(date + "T12:00:00");
      const endDate = new Date(date + "T12:00:00");
      endDate.setDate(endDate.getDate() + 1);

      return await prisma.workoutSession.findMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          exercises: {
            include: {
              workoutSets: {
                orderBy: { setNumber: "asc" }, // Order sets efficiently
              },
            },
            orderBy: { orderInSession: "asc" },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });
    },

    allWorkoutDates: async () => {
      const sessions = await prisma.workoutSession.findMany({
        select: { date: true },
        orderBy: { date: "desc" },
      });

      return sessions.map((session) => {
        // Format date consistently without timezone conversion issues
        const date = new Date(session.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      });
    },

    allLocations: async () => {
      const sessions = await prisma.workoutSession.findMany({
        select: { location: true },
        distinct: ["location"],
        orderBy: { location: "asc" },
      });

      return sessions.map((session) => session.location);
    },

    allWorkoutTypes: async () => {
      const sessions = await prisma.workoutSession.findMany({
        select: { workoutType: true },
        distinct: ["workoutType"],
        orderBy: { workoutType: "asc" },
      });

      return sessions.map((session) => session.workoutType);
    },

    categories: async (_: any, args: any, context: AuthContext) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // Check cache first - now user-specific
      const cacheKey = `${context.user.id}:categories:all`;
      const cachedCategories = await redisCache.get(cacheKey);
      let cacheStatus = "HIT";

      if (cachedCategories) {
        const cacheMetadata = {
          key: cacheKey,
          status: "HIT",
          timestamp: new Date().toISOString(),
          ttl: 3600000,
          totalExercises: cachedCategories.length,
          filteredCount: cachedCategories.length,
          returnedCount: cachedCategories.length,
        };
        console.log("📂 Categories cache HIT:", cacheMetadata);
        return {
          categories: cachedCategories,
          cache: cacheMetadata,
        };
      }

      cacheStatus = "MISS";
      console.log("📂 Categories cache MISS:", {
        key: cacheKey,
        timestamp: new Date().toISOString(),
      });

      // Fetch from database - filter by user
      const categories = await prisma.category.findMany({
        where: {
          userId: context.user.id,
        },
        orderBy: { name: "asc" },
      });

      // Cache the results for 1 hour
      await redisCache.set(cacheKey, categories, 3600000);

      const cacheMetadata = {
        key: cacheKey,
        status: "MISS",
        timestamp: new Date().toISOString(),
        ttl: 3600000,
        totalExercises: categories.length,
        filteredCount: categories.length,
        returnedCount: categories.length,
      };

      console.log("📂 Categories cached:", cacheMetadata);

      return {
        categories: categories,
        cache: cacheMetadata,
      };
    },

    category: async (_: any, { id }: { id: string }) => {
      return await prisma.category.findUnique({
        where: { id },
      });
    },

    searchExercises: async (
      _: any,
      {
        searchQuery,
        categoryIds,
        limit = 20,
        offset = 0,
      }: {
        searchQuery: string;
        categoryIds?: string[];
        limit?: number;
        offset?: number;
      },
      context: AuthContext
    ) => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      // Require authentication for user-specific search caching
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // Check if we have all user exercises cached with categories
      const cacheKey = `${context.user.id}:exercises`;
      let allExercises = await redisCache.getUserExercises(context.user.id);
      let cacheStatus = "HIT";

      if (!allExercises) {
        cacheStatus = "MISS";
        // Cache miss - fetch all user exercises from database with optimized query
        const exercises = await prisma.workoutExercise.findMany({
          where: {
            session: {
              userId: context.user.id,
            },
          },
          include: {
            workoutSets: {
              orderBy: { setNumber: "asc" },
            },
            session: {
              include: {
                categories: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: [{ session: { date: "desc" } }, { orderInSession: "asc" }],
          // Add query optimization
          take: 1000, // Limit to prevent huge queries
        });

        // Transform categories before caching - filter by user and flatten structure efficiently
        const transformedExercises = exercises.map((exercise) => {
          const userCategories =
            exercise.session.categories?.map((cat: any) => {
              return {
                id: cat.category?.id,
                name: cat.category?.name,
                color: cat.category?.color,
              };
            }) || [];

          return {
            ...exercise,
            session: {
              ...exercise.session,
              categories: userCategories,
            },
          };
        });

        // Cache all exercises for future searches
        await redisCache.setUserExercises(
          context.user.id,
          transformedExercises,
          3600000
        );
        allExercises = transformedExercises;
      }

      // Debug: Log all exercise names for debugging
      console.log(
        "🔍 Search Debug - All exercises:",
        allExercises.map((e) => e.exercise)
      );
      console.log("🔍 Search Debug - Searching for:", searchQuery);

      // Filter exercises in memory
      const filteredExercises = allExercises.filter((exercise) => {
        // Text search (case-insensitive)
        const matchesText = exercise.exercise
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        console.log(
          `🔍 Search Debug - "${exercise.exercise}" matches "${searchQuery}":`,
          matchesText
        );

        if (!matchesText) return false;

        // Category filtering
        if (categoryIds && categoryIds.length > 0) {
          const exerciseCategoryIds =
            exercise.session.categories
              ?.map((cat: any) => cat.id)
              .filter(Boolean) || [];

          const hasMatchingCategory = categoryIds.some((categoryId) =>
            exerciseCategoryIds.includes(categoryId)
          );

          return hasMatchingCategory;
        }

        return true;
      });

      // Apply pagination
      const paginatedResults = filteredExercises.slice(offset, offset + limit);

      // Categories are already transformed when cached, so no need to transform again
      const transformedResults = paginatedResults;

      // Debug final results
      console.log(
        "🔍 Final search results:",
        transformedResults.map((ex) => ({
          id: ex.id,
          exercise: ex.exercise,
          sessionId: ex.sessionId,
          categories: ex.session?.categories,
        }))
      );

      // Add cache metadata to the response
      const cacheMetadata = {
        key: cacheKey,
        status: cacheStatus,
        timestamp: new Date().toISOString(),
        ttl: 3600000,
        totalExercises: allExercises.length,
        filteredCount: filteredExercises.length,
        returnedCount: transformedResults.length,
      };

      // Return results with cache metadata
      return {
        exercises: transformedResults,
        cache: cacheMetadata,
      };
    },
  },

  Mutation: {
    deleteWorkoutSession: async (
      _: any,
      { sessionId }: { sessionId: string }
    ) => {
      try {
        // Check if session exists first and get userId
        const existingSession = await prisma.workoutSession.findUnique({
          where: { id: sessionId },
          select: { userId: true },
        });

        if (!existingSession) {
          throw new Error(`Workout session with ID ${sessionId} not found`);
        }

        // Delete the session (exercises and sets will be deleted by cascade)
        await prisma.workoutSession.delete({
          where: { id: sessionId },
        });

        // NUCLEAR: Clear ALL caches after delete
        await redisCache.clearAllUserCache(existingSession.userId);

        // Also clear ALL cache keys
        await redisCache.clear();

        return 1; // Return count of deleted sessions
      } catch (error: any) {
        console.error("Error deleting workout session:", error);
        throw new Error(`Failed to delete workout session: ${error.message}`);
      }
    },

    createCategory: async (
      _: any,
      {
        name,
        color,
        description,
      }: { name: string; color?: string; description?: string },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      const category = await prisma.category.create({
        data: {
          name,
          color: color || "#3B82F6",
          description,
          userId: context.user.id,
        },
      });

      // Clear user-specific categories cache
      await redisCache.delete(`${context.user.id}:categories:all`);
      console.log("📂 User categories cache cleared after create");

      return category;
    },

    updateCategory: async (
      _: any,
      {
        id,
        name,
        color,
        description,
      }: {
        id: string;
        name?: string;
        color?: string;
        description?: string;
      },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // First check if the category belongs to the user
      const existingCategory = await prisma.category.findFirst({
        where: { id, userId: context.user.id },
      });

      if (!existingCategory) {
        throw new Error("Category not found or access denied");
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(color !== undefined && { color }),
          ...(description !== undefined && { description }),
        },
      });

      // Clear user-specific categories cache
      await redisCache.delete(`${context.user.id}:categories:all`);
      console.log("📂 User categories cache cleared after update");

      return category;
    },

    deleteCategory: async (
      _: any,
      { id }: { id: string },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // First check if the category belongs to the user
      const existingCategory = await prisma.category.findFirst({
        where: { id, userId: context.user.id },
      });

      if (!existingCategory) {
        throw new Error("Category not found or access denied");
      }

      const category = await prisma.category.delete({
        where: { id },
      });

      // Clear user-specific categories cache
      await redisCache.delete(`${context.user.id}:categories:all`);
      console.log("📂 User categories cache cleared after delete");

      return category;
    },

    // User authentication
    createUser: async (
      _: any,
      {
        email,
        name,
        password,
      }: { email: string; name: string; password: string }
    ) => {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      return await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });
    },

    loginUser: async (
      _: any,
      { email, password }: { email: string; password: string }
    ) => {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify the password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      return {
        user,
        token,
      };
    },

    changePassword: async (
      _: any,
      {
        currentPassword,
        newPassword,
      }: { currentPassword: string; newPassword: string },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // Find the user
      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify the current password
      const isValidCurrentPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidCurrentPassword) {
        return {
          success: false,
          message: "Current password is incorrect",
        };
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update the user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      return {
        success: true,
        message: "Password changed successfully",
      };
    },

    updateUserName: async (
      _: any,
      { name }: { name: string },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      // Validate name
      if (!name.trim()) {
        return {
          success: false,
          message: "Name is required",
          user: context.user,
        };
      }

      // Update the user's name
      const updatedUser = await prisma.user.update({
        where: { id: context.user.id },
        data: { name: name.trim() },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: "Name updated successfully",
        user: updatedUser,
      };
    },

    createWorkoutSession: async (
      _: any,
      {
        date,
        location,
        workoutType,
        duration,
        activeCalories,
        totalCalories,
        avgHeartRate,
        effort,
        sessionName,
        notes,
        categoryIds,
      }: {
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
        categoryIds?: string[];
      },
      context: AuthContext
    ) => {
      // Require authentication
      if (!context.user) {
        throw new Error("Authentication required");
      }

      const newSession = await prisma.workoutSession.create({
        data: {
          userId: context.user.id,
          date: new Date(date),
          location,
          workoutType,
          duration,
          activeCalories,
          totalCalories,
          avgHeartRate,
          effort,
          sessionName,
          notes,
          categories: {
            create: categoryIds?.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          },
        },
        include: {
          exercises: true,
          // Remove categories from direct query - let the resolver handle it
        },
      });

      // Clear user's cache since data changed
      await redisCache.clearAllUserCache(context.user.id);

      return newSession;
    },

    updateWorkoutSession: async (
      _: any,
      {
        id,
        date,
        location,
        workoutType,
        duration,
        activeCalories,
        totalCalories,
        avgHeartRate,
        effort,
        sessionName,
        notes,
        categoryIds,
      }: {
        id: string;
        date?: string;
        location?: string;
        workoutType?: string;
        duration?: number;
        activeCalories?: number;
        totalCalories?: number;
        avgHeartRate?: number;
        effort?: number;
        sessionName?: string;
        notes?: string;
        categoryIds?: string[];
      }
    ) => {
      const updateData: any = {};
      if (date !== undefined) updateData.date = new Date(date);
      if (location !== undefined) updateData.location = location;
      if (workoutType !== undefined) updateData.workoutType = workoutType;
      if (duration !== undefined) updateData.duration = duration;
      if (activeCalories !== undefined)
        updateData.activeCalories = activeCalories;
      if (totalCalories !== undefined) updateData.totalCalories = totalCalories;
      if (avgHeartRate !== undefined) updateData.avgHeartRate = avgHeartRate;
      if (effort !== undefined) updateData.effort = effort;
      if (sessionName !== undefined) updateData.sessionName = sessionName;
      if (notes !== undefined) updateData.notes = notes;

      if (categoryIds !== undefined) {
        await prisma.workoutSessionCategory.deleteMany({
          where: { sessionId: id },
        });
        if (categoryIds.length > 0) {
          updateData.categories = {
            create: categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          };
        }
      }

      // Get the userId before updating
      const session = await prisma.workoutSession.findUnique({
        where: { id },
        select: { userId: true },
      });

      const updatedSession = await prisma.workoutSession.update({
        where: { id },
        data: updateData,
        include: {
          exercises: true,
          // Remove categories from direct query - let the resolver handle it
        },
      });

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return updatedSession;
    },

    createWorkoutExercise: async (
      _: any,
      {
        sessionId,
        component,
        exercise,
        notes,
        orderInSession,
        isWeightTracked,
        weight,
        reps,
        sets,
        workoutSets,
      }: {
        sessionId: string;
        component: string;
        exercise: string;
        notes?: string;
        orderInSession?: number;
        isWeightTracked?: boolean;
        weight?: number;
        reps?: number;
        sets?: number;
        workoutSets?: any[];
      }
    ) => {
      // Get the userId from the session
      const session = await prisma.workoutSession.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });

      const newExercise = await prisma.workoutExercise.create({
        data: {
          sessionId,
          component,
          exercise,
          notes,
          orderInSession,
          isWeightTracked,
          weight,
          reps,
          sets,
          workoutSets: {
            create: workoutSets?.map((set) => ({
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
            })),
          },
        },
        include: {
          workoutSets: true,
        },
      });

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return newExercise;
    },

    updateWorkoutExercise: async (
      _: any,
      {
        id,
        component,
        exercise,
        notes,
        orderInSession,
        isWeightTracked,
        weight,
        reps,
        sets,
        workoutSets,
      }: {
        id: string;
        component?: string;
        exercise?: string;
        notes?: string;
        orderInSession?: number;
        isWeightTracked?: boolean;
        weight?: number;
        reps?: number;
        sets?: number;
        workoutSets?: any[];
      }
    ) => {
      const updateData: any = {};
      if (component !== undefined) updateData.component = component;
      if (exercise !== undefined) updateData.exercise = exercise;
      if (notes !== undefined) updateData.notes = notes;
      if (orderInSession !== undefined)
        updateData.orderInSession = orderInSession;
      if (isWeightTracked !== undefined)
        updateData.isWeightTracked = isWeightTracked;
      if (weight !== undefined) updateData.weight = weight;
      if (reps !== undefined) updateData.reps = reps;
      if (sets !== undefined) updateData.sets = sets;

      if (workoutSets !== undefined) {
        await prisma.workoutSet.deleteMany({
          where: { exerciseId: id },
        });
        if (workoutSets.length > 0) {
          updateData.workoutSets = {
            create: workoutSets.map((set) => ({
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
            })),
          };
        }
      }

      // Get the userId from the session before updating
      const exerciseRecord = await prisma.workoutExercise.findUnique({
        where: { id },
        select: { sessionId: true },
      });

      const session = exerciseRecord
        ? await prisma.workoutSession.findUnique({
            where: { id: exerciseRecord.sessionId },
            select: { userId: true },
          })
        : null;

      const updatedExercise = await prisma.workoutExercise.update({
        where: { id },
        data: updateData,
        include: {
          workoutSets: true,
        },
      });

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return updatedExercise;
    },

    deleteWorkoutExercise: async (_: any, { id }: { id: string }) => {
      // Get the userId from the session before deleting
      const exerciseRecord = await prisma.workoutExercise.findUnique({
        where: { id },
        select: { sessionId: true },
      });

      const session = exerciseRecord
        ? await prisma.workoutSession.findUnique({
            where: { id: exerciseRecord.sessionId },
            select: { userId: true },
          })
        : null;

      const deletedExercise = await prisma.workoutExercise.delete({
        where: { id },
      });

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return deletedExercise;
    },

    updateWorkoutSessionCategories: async (
      _: any,
      { sessionId, categoryIds }: { sessionId: string; categoryIds: string[] }
    ) => {
      // Get the userId from the session
      const session = await prisma.workoutSession.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });

      await prisma.workoutSessionCategory.deleteMany({
        where: { sessionId },
      });

      if (categoryIds.length > 0) {
        await prisma.workoutSessionCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            sessionId,
            categoryId,
          })),
        });
      }

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return 1;
    },

    updateWorkoutSessionDateTime: async (
      _: any,
      {
        sessionId,
        newDate,
        newTime,
        location,
        workoutType,
      }: {
        sessionId: string;
        newDate: string;
        newTime: string;
        location?: string;
        workoutType?: string;
      }
    ) => {
      const newDateTime = new Date(`${newDate}T${newTime}:00.000Z`);

      const updateData: any = {
        date: newDateTime,
      };

      if (location !== undefined) {
        updateData.location = location;
      }
      if (workoutType !== undefined) {
        updateData.workoutType = workoutType;
      }

      // Get the userId from the session before updating
      const session = await prisma.workoutSession.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });

      const updatedSession = await prisma.workoutSession.update({
        where: { id: sessionId },
        data: updateData,
        include: {
          exercises: true,
          // Remove categories from direct query - let the resolver handle it
        },
      });

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return updatedSession;
    },

    reorderWorkoutExercises: async (
      _: any,
      { exerciseIds }: { exerciseIds: string[] }
    ) => {
      // Get the userId from the first exercise's session
      const firstExercise = await prisma.workoutExercise.findUnique({
        where: { id: exerciseIds[0] },
        select: { sessionId: true },
      });

      const session = firstExercise
        ? await prisma.workoutSession.findUnique({
            where: { id: firstExercise.sessionId },
            select: { userId: true },
          })
        : null;

      await prisma.$transaction(
        exerciseIds.map((id, index) =>
          prisma.workoutExercise.update({
            where: { id },
            data: { orderInSession: index },
          })
        )
      );

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return true;
    },

    updateExerciseComponentName: async (
      _: any,
      { exerciseId, newName }: { exerciseId: string; newName: string }
    ) => {
      // Get the userId from the exercise's session
      const exercise = await prisma.workoutExercise.findUnique({
        where: { id: exerciseId },
        select: { sessionId: true },
      });

      const session = exercise
        ? await prisma.workoutSession.findUnique({
            where: { id: exercise.sessionId },
            select: { userId: true },
          })
        : null;

      const updatedExercise = await prisma.workoutExercise.update({
        where: { id: exerciseId },
        data: { component: newName },
      });

      // Clear user's workout cache since data changed
      if (session) {
        await redisCache.clearAllUserCache(session.userId);
      }

      return updatedExercise;
    },

    updateExerciseNotes: async (
      _: any,
      { exerciseId, notes }: { exerciseId: string; notes: string }
    ) => {
      // Get the userId from the exercise's session
      const exercise = await prisma.workoutExercise.findUnique({
        where: { id: exerciseId },
        select: {
          sessionId: true,
          session: {
            select: { userId: true },
          },
        },
      });

      if (!exercise) {
        throw new Error("Exercise not found");
      }

      const updatedExercise = await prisma.workoutExercise.update({
        where: { id: exerciseId },
        data: { notes: notes },
      });

      // Clear user's workout cache since data changed
      if (exercise.session.userId) {
        await redisCache.clearAllUserCache(exercise.session.userId);
      }

      return updatedExercise;
    },

    updateWorkoutSet: async (
      _: any,
      {
        setId,
        weight,
        reps,
        equipment,
      }: { setId: string; weight: number; reps: number; equipment?: string }
    ) => {
      // Get the userId from the set's exercise session
      const workoutSet = await prisma.workoutSet.findUnique({
        where: { id: setId },
        select: {
          exerciseId: true,
          exercise: {
            select: {
              sessionId: true,
              session: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!workoutSet) {
        throw new Error("Workout set not found");
      }

      const updateData: any = { weight, reps };
      if (equipment !== undefined) {
        updateData.equipment = equipment;
      }

      console.log("🔍 updateWorkoutSet - equipment parameter:", equipment);
      console.log("🔍 updateWorkoutSet - updateData:", updateData);

      const updatedSet = await prisma.workoutSet.update({
        where: { id: setId },
        data: updateData,
      });

      // Clear user's workout cache since data changed
      if (workoutSet.exercise.session.userId) {
        await redisCache.clearAllUserCache(workoutSet.exercise.session.userId);
      }

      return updatedSet;
    },

    updateExerciseName: async (
      _: any,
      { exerciseId, newName }: { exerciseId: string; newName: string }
    ) => {
      // Get the userId from the exercise's session
      const exercise = await prisma.workoutExercise.findUnique({
        where: { id: exerciseId },
        select: {
          sessionId: true,
          session: {
            select: { userId: true },
          },
        },
      });

      if (!exercise) {
        throw new Error("Exercise not found");
      }

      const updatedExercise = await prisma.workoutExercise.update({
        where: { id: exerciseId },
        data: { exercise: newName },
      });

      // Clear user's workout cache since data changed
      if (exercise.session.userId) {
        await redisCache.clearAllUserCache(exercise.session.userId);
      }

      return updatedExercise;
    },

    createWorkoutSet: async (
      _: any,
      {
        exerciseId,
        setNumber,
        weight,
        reps,
        equipment,
      }: {
        exerciseId: string;
        setNumber: number;
        weight: number;
        reps: number;
        equipment?: string;
      }
    ) => {
      // Get the userId from the exercise's session
      const exercise = await prisma.workoutExercise.findUnique({
        where: { id: exerciseId },
        select: {
          sessionId: true,
          session: {
            select: { userId: true },
          },
        },
      });

      if (!exercise) {
        throw new Error("Exercise not found");
      }

      const newSet = await prisma.workoutSet.create({
        data: {
          exerciseId,
          setNumber,
          weight,
          reps,
          equipment: equipment || "dumbbell-both",
        },
      });

      // Clear user's workout cache since data changed
      if (exercise.session.userId) {
        await redisCache.clearAllUserCache(exercise.session.userId);
      }

      return newSet;
    },

    deleteWorkoutSet: async (_: any, { setId }: { setId: string }) => {
      // Get the userId from the set's exercise's session
      const workoutSet = await prisma.workoutSet.findUnique({
        where: { id: setId },
        select: {
          exerciseId: true,
          exercise: {
            select: {
              sessionId: true,
              session: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!workoutSet) {
        throw new Error("Workout set not found");
      }

      // Delete the set
      await prisma.workoutSet.delete({
        where: { id: setId },
      });

      // Clear user's workout cache since data changed
      if (workoutSet.exercise.session.userId) {
        await redisCache.clearAllUserCache(workoutSet.exercise.session.userId);
      }

      return 1; // Return 1 to indicate successful deletion
    },
  },
};
