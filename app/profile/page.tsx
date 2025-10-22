"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import Profile from "../components/Profile";
import Header from "../components/Header";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useUser();

  // Redirect to home if not authenticated
  useEffect(() => {
    console.log(
      "ProfilePage - isLoading:",
      isLoading,
      "isAuthenticated:",
      isAuthenticated,
      "user:",
      user
    );
    if (!isLoading && !isAuthenticated) {
      console.log("Redirecting to home - not authenticated");
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading or nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header currentPage="profile" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-32 md:pt-8">
        <Profile />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            {/* <p className="text-gray-600 dark:text-gray-400 text-sm">
              Built with Next.js, GraphQL, and Prisma
            </p> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
