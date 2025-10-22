"use client";

import WorkoutListSimple from "./components/WorkoutListSimple";
import Header from "./components/Header";
import { useState } from "react";
import SystemTime from "./components/SystemTime";
import { ModalProvider } from "./services/modalService";
import { useUser } from "./contexts/UserContext";
import CategoryFilterDialog from "./components/CategoryFilterDialog";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const { isAuthenticated, isLoading } = useUser();

  const handleImportComplete = () => {
    // Force refresh of workout list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header currentPage="workouts" />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-32 md:pt-8">
          {isAuthenticated ? (
            <WorkoutListSimple
              key={`workouts-${refreshKey}`}
              onCategoriesLoaded={setCategories}
            />
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">💪</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to Workouts
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Track your workouts, monitor your progress, and achieve your
                  fitness goals.
                </p>
                <button
                  onClick={() => {
                    /* This will be handled by the Header component */
                  }}
                  className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                System time: <SystemTime />
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Category Filter Dialog - Moved to page level to prevent re-rendering */}
      {isAuthenticated && (
        <CategoryFilterDialog
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onCategoryChange={setSelectedCategoryIds}
          isOpen={isCategoryDialogOpen}
          onClose={() => setIsCategoryDialogOpen(false)}
        />
      )}
    </ModalProvider>
  );
}
