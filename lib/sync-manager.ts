import { indexedDBManager, isIndexedDBSupported } from "./indexeddb";

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingSyncCount: number;
  isSyncing: boolean;
}

class SyncManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private lastSyncTime: number | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.initializeSync();
    }
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("Sync Manager: Back online, starting sync...");
      this.notifyListeners();
      this.syncWhenOnline();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("Sync Manager: Gone offline");
      this.notifyListeners();
    });

    // Listen for visibility change to sync when tab becomes active
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isOnline && !this.syncInProgress) {
        this.syncWhenOnline();
      }
    });
  }

  private async initializeSync() {
    if (!isIndexedDBSupported()) {
      console.log(
        "Sync Manager: IndexedDB not supported, skipping offline sync"
      );
      return;
    }

    try {
      await indexedDBManager.init();
      console.log("Sync Manager: IndexedDB initialized");

      // Try to sync if we're online
      if (this.isOnline) {
        await this.syncWhenOnline();
      }
    } catch (error) {
      console.error("Sync Manager: Failed to initialize IndexedDB:", error);
    }
  }

  private async syncWhenOnline() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      console.log("Sync Manager: Starting sync...");

      // Get current user ID from localStorage
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.log("Sync Manager: No user ID found, skipping sync");
        return;
      }

      // Get unsynced data
      const [unsyncedWorkouts, unsyncedCategories] = await Promise.all([
        indexedDBManager.getUnsyncedWorkouts(userId),
        indexedDBManager.getUnsyncedCategories(userId),
      ]);

      console.log(
        `Sync Manager: Found ${unsyncedWorkouts.length} unsynced workouts, ${unsyncedCategories.length} unsynced categories`
      );

      // Sync workouts
      for (const workout of unsyncedWorkouts) {
        try {
          await this.syncWorkout(workout);
          await indexedDBManager.markAsSynced("workouts", workout.id);
          console.log(`Sync Manager: Synced workout ${workout.id}`);
        } catch (error) {
          console.error(
            `Sync Manager: Failed to sync workout ${workout.id}:`,
            error
          );
        }
      }

      // Sync categories
      for (const category of unsyncedCategories) {
        try {
          await this.syncCategory(category);
          await indexedDBManager.markAsSynced("categories", category.id);
          console.log(`Sync Manager: Synced category ${category.id}`);
        } catch (error) {
          console.error(
            `Sync Manager: Failed to sync category ${category.id}:`,
            error
          );
        }
      }

      this.lastSyncTime = Date.now();
      console.log("Sync Manager: Sync completed successfully");
    } catch (error) {
      console.error("Sync Manager: Sync failed:", error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async syncWorkout(workout: any): Promise<void> {
    const response = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        query: `
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
            }
          }
        `,
        variables: {
          date: workout.date,
          location: workout.location,
          workoutType: workout.workoutType,
          duration: workout.duration,
          activeCalories: workout.activeCalories,
          totalCalories: workout.totalCalories,
          avgHeartRate: workout.avgHeartRate,
          effort: workout.effort,
          sessionName: workout.sessionName,
          notes: workout.notes,
          categoryIds: workout.categories.map((cat: any) => cat.id),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync workout: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }
  }

  private async syncCategory(category: any): Promise<void> {
    const response = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateCategory($name: String!, $color: String, $description: String) {
            createCategory(name: $name, color: $color, description: $description) {
              id
            }
          }
        `,
        variables: {
          name: category.name,
          color: category.color,
          description: category.description,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync category: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }
  }

  private getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;

    // Try to get user ID from localStorage or JWT token
    const token = localStorage.getItem("workoutToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.sub || null;
      } catch (error) {
        console.error("Sync Manager: Failed to parse token:", error);
      }
    }

    return localStorage.getItem("userId");
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("workoutToken");
  }

  // Public methods
  async saveWorkoutOffline(workout: any): Promise<void> {
    if (!isIndexedDBSupported()) {
      console.log("Sync Manager: IndexedDB not supported, cannot save offline");
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error("No user ID found");
    }

    const workoutData = {
      ...workout,
      userId,
      synced: false,
    };

    await indexedDBManager.saveWorkout(workoutData);
    console.log("Sync Manager: Workout saved offline");

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncWhenOnline();
    }
  }

  async saveCategoryOffline(category: any): Promise<void> {
    if (!isIndexedDBSupported()) {
      console.log("Sync Manager: IndexedDB not supported, cannot save offline");
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error("No user ID found");
    }

    const categoryData = {
      ...category,
      userId,
      synced: false,
    };

    await indexedDBManager.saveCategory(categoryData);
    console.log("Sync Manager: Category saved offline");

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncWhenOnline();
    }
  }

  async getOfflineWorkouts(userId: string): Promise<any[]> {
    if (!isIndexedDBSupported()) {
      return [];
    }

    return await indexedDBManager.getWorkouts(userId);
  }

  async getOfflineCategories(userId: string): Promise<any[]> {
    if (!isIndexedDBSupported()) {
      return [];
    }

    return await indexedDBManager.getCategories(userId);
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.syncWhenOnline();
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingSyncCount: 0, // This would need to be calculated
      isSyncing: this.syncInProgress,
    };
  }

  // Subscribe to sync status changes
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    const status = this.getSyncStatus();
    this.syncListeners.forEach((callback) => callback(status));
  }

  // Check if we should use offline data
  shouldUseOfflineData(): boolean {
    return !this.isOnline || this.syncInProgress;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
