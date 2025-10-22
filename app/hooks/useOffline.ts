import { useState, useEffect, useCallback } from "react";
import { syncManager } from "@/lib/sync-manager";
import { indexedDBManager, isIndexedDBSupported } from "@/lib/indexeddb";

interface OfflineStatus {
  isOnline: boolean;
  isSupported: boolean;
  pendingSyncCount: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
}

interface OfflineWorkout {
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
  exercises: any[];
  categories: any[];
  lastModified: number;
  synced: boolean;
}

interface OfflineCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  description?: string;
  lastModified: number;
  synced: boolean;
}

export const useOffline = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isSupported: isIndexedDBSupported(),
    pendingSyncCount: 0,
    lastSyncTime: null,
    isSyncing: false,
  });

  const [offlineWorkouts, setOfflineWorkouts] = useState<OfflineWorkout[]>([]);
  const [offlineCategories, setOfflineCategories] = useState<OfflineCategory[]>(
    []
  );

  // Get current user ID
  const getCurrentUserId = useCallback((): string | null => {
    const token = localStorage.getItem("workoutToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.sub || null;
      } catch (error) {
        console.error("Failed to parse token:", error);
      }
    }
    return localStorage.getItem("userId");
  }, []);

  // Load offline data
  const loadOfflineData = useCallback(async () => {
    if (!status.isSupported) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const [workouts, categories] = await Promise.all([
        indexedDBManager.getWorkouts(userId),
        indexedDBManager.getCategories(userId),
      ]);

      setOfflineWorkouts(workouts);
      setOfflineCategories(categories);
    } catch (error) {
      console.error("Failed to load offline data:", error);
    }
  }, [status.isSupported, getCurrentUserId]);

  // Save workout offline
  const saveWorkoutOffline = useCallback(
    async (workout: any) => {
      if (!status.isSupported) {
        throw new Error("Offline storage not supported");
      }

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("No user ID found");
      }

      try {
        await syncManager.saveWorkoutOffline(workout);
        await loadOfflineData(); // Refresh offline data
      } catch (error) {
        console.error("Failed to save workout offline:", error);
        throw error;
      }
    },
    [status.isSupported, getCurrentUserId, loadOfflineData]
  );

  // Save category offline
  const saveCategoryOffline = useCallback(
    async (category: any) => {
      if (!status.isSupported) {
        throw new Error("Offline storage not supported");
      }

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("No user ID found");
      }

      try {
        await syncManager.saveCategoryOffline(category);
        await loadOfflineData(); // Refresh offline data
      } catch (error) {
        console.error("Failed to save category offline:", error);
        throw error;
      }
    },
    [status.isSupported, getCurrentUserId, loadOfflineData]
  );

  // Force sync
  const forceSync = useCallback(async () => {
    try {
      await syncManager.forceSync();
      await loadOfflineData(); // Refresh offline data
    } catch (error) {
      console.error("Failed to force sync:", error);
      throw error;
    }
  }, [loadOfflineData]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    if (!status.isSupported) return;

    try {
      await indexedDBManager.clearAllData();
      setOfflineWorkouts([]);
      setOfflineCategories([]);
    } catch (error) {
      console.error("Failed to clear offline data:", error);
    }
  }, [status.isSupported]);

  // Get storage stats
  const getStorageStats = useCallback(async () => {
    if (!status.isSupported) {
      return {
        workouts: 0,
        categories: 0,
        unsyncedWorkouts: 0,
        unsyncedCategories: 0,
      };
    }

    try {
      return await indexedDBManager.getStorageStats();
    } catch (error) {
      console.error("Failed to get storage stats:", error);
      return {
        workouts: 0,
        categories: 0,
        unsyncedWorkouts: 0,
        unsyncedCategories: 0,
      };
    }
  }, [status.isSupported]);

  // Check if we should use offline data
  const shouldUseOfflineData = useCallback(() => {
    return syncManager.shouldUseOfflineData();
  }, []);

  // Get offline workouts with fallback
  const getOfflineWorkouts = useCallback(async (): Promise<
    OfflineWorkout[]
  > => {
    if (!status.isSupported || !shouldUseOfflineData()) {
      return [];
    }

    const userId = getCurrentUserId();
    if (!userId) return [];

    try {
      return await indexedDBManager.getWorkouts(userId);
    } catch (error) {
      console.error("Failed to get offline workouts:", error);
      return [];
    }
  }, [status.isSupported, shouldUseOfflineData, getCurrentUserId]);

  // Get offline categories with fallback
  const getOfflineCategories = useCallback(async (): Promise<
    OfflineCategory[]
  > => {
    if (!status.isSupported || !shouldUseOfflineData()) {
      return [];
    }

    const userId = getCurrentUserId();
    if (!userId) return [];

    try {
      return await indexedDBManager.getCategories(userId);
    } catch (error) {
      console.error("Failed to get offline categories:", error);
      return [];
    }
  }, [status.isSupported, shouldUseOfflineData, getCurrentUserId]);

  // Setup event listeners
  useEffect(() => {
    const unsubscribe = syncManager.onSyncStatusChange((syncStatus) => {
      setStatus((prev) => ({
        ...prev,
        isOnline: syncStatus.isOnline,
        lastSyncTime: syncStatus.lastSyncTime,
        pendingSyncCount: syncStatus.pendingSyncCount,
        isSyncing: syncStatus.isSyncing,
      }));
    });

    return unsubscribe;
  }, []);

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, [loadOfflineData]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    // Status
    status,
    offlineWorkouts,
    offlineCategories,

    // Actions
    saveWorkoutOffline,
    saveCategoryOffline,
    forceSync,
    clearOfflineData,
    loadOfflineData,

    // Utilities
    getStorageStats,
    shouldUseOfflineData,
    getOfflineWorkouts,
    getOfflineCategories,
  };
};
