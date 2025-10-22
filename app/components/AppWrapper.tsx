"use client";

import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import LoadingScreen as a client-only component to avoid hydration issues
const LoadingScreen = dynamic(() => import("./LoadingScreen"), {
  ssr: false,
});

function AppWrapperComponent({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useUser();

  // Check for session token immediately to prevent flash
  const [hasSessionToken, setHasSessionToken] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("workoutToken");
    }
    return false;
  });

  const [showLoading, setShowLoading] = useState(() => {
    if (typeof window !== "undefined") {
      // Only show loading screen on cold loads, not internal navigation
      const hasToken = !!localStorage.getItem("workoutToken");
      const isInternalNavigation = sessionStorage.getItem("app-has-loaded");

      if (hasToken && !isInternalNavigation) {
        return true; // Cold load with token
      }
      return false; // Internal navigation or no token
    }
    return true;
  });

  // Handle case where user is not authenticated - hide loading screen quickly
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Check if there's no session token at all - show app immediately
      const hasToken = localStorage.getItem("workoutToken");
      if (!hasToken) {
        setShowLoading(false);
        // Mark that the app has loaded at least once (for internal navigation detection)
        sessionStorage.setItem("app-has-loaded", "true");
        return;
      }

      // If there was a token but user is not authenticated, wait briefly
      const timeout = setTimeout(() => {
        setShowLoading(false);
        // Mark that the app has loaded at least once (for internal navigation detection)
        sessionStorage.setItem("app-has-loaded", "true");
      }, 500); // 0.5 second timeout for unauthenticated users

      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated]);

  // Listen for GraphQL loading completion events
  useEffect(() => {
    const handleGraphQLComplete = () => {
      // Add a small delay to ensure all UI updates are complete
      setTimeout(() => {
        setShowLoading(false);
        // Mark that the app has loaded at least once (for internal navigation detection)
        sessionStorage.setItem("app-has-loaded", "true");
      }, 200); // 200ms delay to ensure all renders and layout shifts are complete
    };

    window.addEventListener(
      "all-graphql-queries-complete",
      handleGraphQLComplete
    );
    return () =>
      window.removeEventListener(
        "all-graphql-queries-complete",
        handleGraphQLComplete
      );
  }, []);

  // Hide loading screen when user context is no longer loading (GraphQL calls complete)
  useEffect(() => {
    if (!isLoading && isAuthenticated && hasSessionToken) {
      // Wait a bit more to ensure all data is loaded
      const timeout = setTimeout(() => {
        setShowLoading(false);
        // Mark that the app has loaded at least once (for internal navigation detection)
        sessionStorage.setItem("app-has-loaded", "true");
      }, 1500); // 1.5 second delay to ensure all GraphQL queries complete

      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated, hasSessionToken]);

  // 3-second maximum timeout for loading screen
  useEffect(() => {
    const maxTimeout = setTimeout(() => {
      setShowLoading(false);
      // Mark that the app has loaded at least once (for internal navigation detection)
      sessionStorage.setItem("app-has-loaded", "true");
    }, 3000); // 3 second maximum timeout

    return () => clearTimeout(maxTimeout);
  }, []);

  return (
    <>
      {/* Load app content in background while showing loading screen */}
      <div
        style={{
          visibility:
            hasSessionToken && (showLoading || isLoading)
              ? "hidden"
              : "visible",
        }}
      >
        {children}
      </div>

      {/* Show loading screen as overlay - only if there's a session token */}
      {hasSessionToken && (showLoading || isLoading) && <LoadingScreen />}
    </>
  );
}

// Make AppWrapper client-only to avoid hydration issues
export default dynamic(() => Promise.resolve(AppWrapperComponent), {
  ssr: false,
});
