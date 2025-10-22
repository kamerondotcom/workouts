// IndexedDB utility for local workout data storage
interface WorkoutData {
  id: string;
  userId: string;
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
  exercises: WorkoutExerciseData[];
  categories: CategoryData[];
  lastModified: number;
  synced: boolean;
}

interface WorkoutExerciseData {
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
  workoutSets: WorkoutSetData[];
  createdAt: string;
  updatedAt: string;
}

interface WorkoutSetData {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryData {
  id: string;
  userId: string;
  name: string;
  color: string;
  description?: string;
  lastModified: number;
  synced: boolean;
}

class IndexedDBManager {
  private dbName = "WorkoutDB";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("IndexedDB failed to open:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB opened successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create workout sessions store
        if (!db.objectStoreNames.contains("workouts")) {
          const workoutStore = db.createObjectStore("workouts", {
            keyPath: "id",
          });
          workoutStore.createIndex("userId", "userId", { unique: false });
          workoutStore.createIndex("date", "date", { unique: false });
          workoutStore.createIndex("synced", "synced", { unique: false });
          workoutStore.createIndex("lastModified", "lastModified", {
            unique: false,
          });
        }

        // Create categories store
        if (!db.objectStoreNames.contains("categories")) {
          const categoryStore = db.createObjectStore("categories", {
            keyPath: "id",
          });
          categoryStore.createIndex("userId", "userId", { unique: false });
          categoryStore.createIndex("synced", "synced", { unique: false });
          categoryStore.createIndex("lastModified", "lastModified", {
            unique: false,
          });
        }

        // Create sync queue store for offline operations
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("type", "type", { unique: false });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  // Workout operations
  async saveWorkout(workout: WorkoutData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["workouts"], "readwrite");
      const store = transaction.objectStore("workouts");

      const workoutData = {
        ...workout,
        lastModified: Date.now(),
        synced: false,
      };

      const request = store.put(workoutData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getWorkouts(userId: string): Promise<WorkoutData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["workouts"], "readonly");
      const store = transaction.objectStore("workouts");
      const index = store.index("userId");
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const workouts = request.result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(workouts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getWorkout(id: string): Promise<WorkoutData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["workouts"], "readonly");
      const store = transaction.objectStore("workouts");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWorkout(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["workouts"], "readwrite");
      const store = transaction.objectStore("workouts");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Category operations
  async saveCategory(category: CategoryData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");

      const categoryData = {
        ...category,
        lastModified: Date.now(),
        synced: false,
      };

      const request = store.put(categoryData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCategories(userId: string): Promise<CategoryData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const index = store.index("userId");
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync operations
  async getUnsyncedWorkouts(userId: string): Promise<WorkoutData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["workouts"], "readonly");
      const store = transaction.objectStore("workouts");
      const index = store.index("userId");
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const unsynced = request.result.filter((workout) => !workout.synced);
        resolve(unsynced);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedCategories(userId: string): Promise<CategoryData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const index = store.index("userId");
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const unsynced = request.result.filter((category) => !category.synced);
        resolve(unsynced);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(
    type: "workouts" | "categories",
    id: string
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([type], "readwrite");
      const store = transaction.objectStore(type);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["workouts", "categories", "syncQueue"],
        "readwrite"
      );

      const clearStore = (storeName: string) => {
        const store = transaction.objectStore(storeName);
        return store.clear();
      };

      Promise.all([
        clearStore("workouts"),
        clearStore("categories"),
        clearStore("syncQueue"),
      ])
        .then(() => resolve())
        .catch(reject);
    });
  }

  // Get storage stats
  async getStorageStats(): Promise<{
    workouts: number;
    categories: number;
    unsyncedWorkouts: number;
    unsyncedCategories: number;
  }> {
    if (!this.db) await this.init();

    const [workouts, categories, unsyncedWorkouts, unsyncedCategories] =
      await Promise.all([
        this.getWorkouts(""), // Get all workouts
        this.getCategories(""), // Get all categories
        this.getUnsyncedWorkouts(""), // Get all unsynced workouts
        this.getUnsyncedCategories(""), // Get all unsynced categories
      ]);

    return {
      workouts: workouts.length,
      categories: categories.length,
      unsyncedWorkouts: unsyncedWorkouts.length,
      unsyncedCategories: unsyncedCategories.length,
    };
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();

// Helper function to check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return typeof window !== "undefined" && "indexedDB" in window;
};
