"use client";

import React from "react";

const SearchSkeleton: React.FC = () => {
  return (
    <div className="mb-6">
      {/* Search input skeleton */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SearchSkeleton;
