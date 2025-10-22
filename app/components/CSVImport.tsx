"use client";

import { useState } from "react";
import { useModal } from "../services/modalService";

export default function CSVImport({
  onImportComplete,
}: {
  onImportComplete?: () => void;
}) {
  const { alert } = useModal();
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleImport = async () => {
    if (!csvText.trim()) {
      setMessage({ type: "error", text: "Please paste CSV data first" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("workoutToken");

      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ csvText }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setCsvText("");

        // Clear service worker cache after successful import
        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: "CLEAR_CACHE",
          });
          console.log("Service Worker cache clear requested after CSV import");
        }

        // Callback to refresh data
        if (onImportComplete) {
          console.log("Calling onImportComplete callback");
          onImportComplete();
        }

        // Dispatch custom event for workout list to listen
        window.dispatchEvent(new CustomEvent("import-complete"));

        // Also use localStorage to trigger refresh when component is not mounted
        localStorage.setItem("workout-import-trigger", Date.now().toString());

        // Also manually clear Redis cache via API call
        try {
          const clearResponse = await fetch("/api/clear-cache", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (clearResponse.ok) {
          } else {
            console.log("⚠️ Failed to clear Redis cache via API");
          }
        } catch (clearError) {
          console.log("⚠️ Error clearing Redis cache:", clearError);
        }
      } else {
        await alert({
          title: "Import Failed",
          message: data.error || "Failed to import CSV data",
          type: "error",
        });
      }
    } catch (error) {
      await alert({
        title: "Import Error",
        message: "An error occurred during import. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Import Workout from CSV
      </h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="csv-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Paste CSV Data
          </label>
          <textarea
            id="csv-input"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Date,Location,Workout Type,Duration (min),Active Calories,Total Calories,Avg Heart Rate (bpm),Effort (1–10),Component,Exercise,Notes
2025-10-21,The Yard Gym,Functional Strength,48,374,465,133,7,Component 1,5 Barbell Back Squat,"
            rows={8}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 font-mono"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Paste your CSV data including the header row
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={!csvText.trim() || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? "Importing..." : "Import Workout"}
        </button>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
