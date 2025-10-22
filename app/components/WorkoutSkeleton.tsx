"use client";

import React from "react";

const WorkoutSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Skeleton cards matching workout session height */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md h-60 animate-pulse"
        ></div>
      ))}
    </div>
  );
};

export default WorkoutSkeleton;
