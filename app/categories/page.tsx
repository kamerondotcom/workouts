"use client";

import Link from "next/link";
import CategoryManager from "../components/CategoryManager";
import Header from "../components/Header";
import { useState, useEffect } from "react";
import SystemTime from "../components/SystemTime";
import { ModalProvider } from "../services/modalService";
import { useUser } from "../contexts/UserContext";
import { useWorkoutDataStore } from "../stores/workoutDataStore";

export default function CategoriesPage() {
  const { isAuthenticated, isLoading } = useUser();
  const { fetchCategories } = useWorkoutDataStore();

  // Initialize categories when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("🏷️ Categories page - Initializing categories...");
      fetchCategories();
    }
  }, [isAuthenticated, isLoading, fetchCategories]);

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header currentPage="categories" />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-32 md:pt-8">
          {/* Category Manager Component */}
          <CategoryManager />
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
    </ModalProvider>
  );
}
