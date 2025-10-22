"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import ProfileDropdown from "./ProfileDropdown";
import LoginDialog from "./LoginDialog";

interface HeaderProps {
  currentPage?: "workouts" | "import" | "categories" | "profile";
}

export default function Header({ currentPage = "workouts" }: HeaderProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, login, isLoading } = useUser();
  const router = useRouter();

  return (
    <>
      <header
        className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 shadow-sm border-b border-blue-200/20 dark:border-blue-700/20 md:relative fixed top-0 left-0 right-0 z-[100]"
        style={{ borderBottomWidth: "1px" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xl sm:text-3xl md:text-3xl">💪</div>
              <div>
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-base sm:text-2xl md:text-2xl font-bold text-white cursor-pointer">
                    Workouts
                  </h1>
                </Link>
              </div>
              <div className="text-xl sm:text-3xl md:text-3xl">🏋🏻‍♂️</div>
            </div>

            {/* Right side - Desktop and Mobile */}
            <div className="flex items-center justify-end">
              {/* Back button for profile page */}
              {currentPage === "profile" && (
                <button
                  onClick={() => router.push("/")}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Back to Workouts"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              {/* User Info - Mobile */}
              {currentPage !== "profile" && (
                <div className="md:hidden">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    !isAuthenticated && (
                      <button
                        onClick={() => setShowLogin(true)}
                        className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-lg text-sm"
                      >
                        Login
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              {isAuthenticated && currentPage !== "profile" && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Toggle mobile menu"
                  style={{ marginLeft: "15px" }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              )}

              {/* User Info - Desktop */}
              {currentPage !== "profile" && (
                <div className="hidden md:flex items-center space-x-4 ml-2">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : isAuthenticated ? (
                    <ProfileDropdown />
                  ) : (
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation - only show when authenticated and not on profile page */}
          {isAuthenticated && currentPage !== "profile" && (
            <div className="hidden md:block mt-6">
              <nav className="flex space-x-1 bg-blue-500/20 p-1 rounded-lg">
                <Link
                  href="/"
                  className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "workouts"
                      ? "bg-blue-600 text-white"
                      : "text-blue-100 hover:text-white hover:bg-blue-500/30"
                  }`}
                >
                  Workouts
                </Link>
                <Link
                  href="/import"
                  className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "import"
                      ? "bg-blue-600 text-white"
                      : "text-blue-100 hover:text-white hover:bg-blue-500/30"
                  }`}
                >
                  Import
                </Link>
                <Link
                  href="/categories"
                  className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentPage === "categories"
                      ? "bg-blue-600 text-white"
                      : "text-blue-100 hover:text-white hover:bg-blue-500/30"
                  }`}
                >
                  Categories
                </Link>
              </nav>
            </div>
          )}

          {/* Mobile Menu */}
          {isAuthenticated && currentPage !== "profile" && isMobileMenuOpen && (
            <div
              className="md:hidden fixed left-0 right-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-xl border-t border-gray-300/30 dark:border-gray-600/30 z-[110]"
              style={{ top: "50px" }}
            >
              <div className="px-4 py-4">
                {/* User Info in Mobile Menu */}
                <div className="pb-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        window.location.href = "/profile";
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-gray-800 dark:text-gray-200 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      Welcome, {user?.name || user?.email}
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Separator line */}
                <div className="border-b-2 border-gray-400/60 dark:border-gray-500/60 my-4"></div>

                <nav className="flex flex-col space-y-2">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-left py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                      currentPage === "workouts"
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Workouts
                  </Link>
                  <Link
                    href="/import"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-left py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                      currentPage === "import"
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Import
                  </Link>
                  <Link
                    href="/categories"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-left py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                      currentPage === "categories"
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Categories
                  </Link>
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={(authPayload) => {
          login(authPayload);
          setShowLogin(false);
        }}
      />
    </>
  );
}
