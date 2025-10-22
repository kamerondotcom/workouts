"use client";

import { useState, useEffect } from "react";

const inspirationalMessages = [
  {
    message: "Grab your wig and find your heels, we're about to werk",
    emoji: "👠",
  },
  {
    message: "May the best woman win - checkered flag energy only",
    emoji: "🏁",
  },
  {
    message: "Get ready to pump some iron in those pump heels",
    emoji: "💪",
  },
  {
    message: "You want a hot body, you want a Bugatti... you better work bitch",
    emoji: "🔥",
  },
];

export default function LoadingScreen() {
  // Use a random selection that varies on each page load
  // This gives variety while avoiding hydration issues by using a stable approach
  const currentMessage = Math.floor(
    Math.random() * inspirationalMessages.length
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-[9999] flex items-center justify-center">
      <div className="text-center px-8 max-w-md">
        <div className="min-h-[80px] flex items-center justify-center">
          <div className="animate-fade-in">
            <div className="text-4xl mb-3">
              {inspirationalMessages[currentMessage].emoji}
            </div>
            <p className="text-white text-lg font-medium leading-relaxed">
              {inspirationalMessages[currentMessage].message}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
