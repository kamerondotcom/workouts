"use client";

import React from "react";
import { useOffline } from "@/app/hooks/useOffline";

const OfflineStatus: React.FC = () => {
  const { status, getStorageStats } = useOffline();
  const [stats, setStats] = React.useState({
    workouts: 0,
    categories: 0,
    unsyncedWorkouts: 0,
    unsyncedCategories: 0,
  });

  React.useEffect(() => {
    const loadStats = async () => {
      const storageStats = await getStorageStats();
      setStats(storageStats);
    };
    loadStats();
  }, [getStorageStats]);

  if (!status.isSupported) {
    return null; // Don't show anything if offline storage isn't supported
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-3 h-3 rounded-full ${
            status.isOnline ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {status.isOnline ? "Online" : "Offline"}
        </span>
        {status.isSyncing && (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Syncing...
          </span>
        )}
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <div>
          Workouts: {stats.workouts} ({stats.unsyncedWorkouts} unsynced)
        </div>
        <div>
          Categories: {stats.categories} ({stats.unsyncedCategories} unsynced)
        </div>
        {status.lastSyncTime && (
          <div>
            Last sync: {new Date(status.lastSyncTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineStatus;
