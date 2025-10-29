"use client";

import { useState, useRef, useEffect } from "react";
interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CategoryFilterDialogProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onCategoryChange: (categoryIds: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryFilterDialog({
  categories,
  selectedCategoryIds,
  onCategoryChange,
  isOpen,
  onClose,
}: CategoryFilterDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Close dialog when clicking outside - DISABLED FOR NOW
  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (
  //       dialogRef.current &&
  //       !dialogRef.current.contains(event.target as Node)
  //     ) {
  //       // Only close if the click is not on a category button
  //       const target = event.target as HTMLElement;
  //       if (!target.closest("button[data-category-button]")) {
  //         onClose();
  //       }
  //     }
  //   }

  //   if (isOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [isOpen, onClose]);

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      // Remove from selection
      onCategoryChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      // Add to selection
      onCategoryChange([...selectedCategoryIds, categoryId]);
    }
    // Don't close the dialog - let user continue filtering
  };

  const handleSelectAll = () => {
    onCategoryChange([]);
    // Don't close the dialog - let user continue filtering
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[120] flex items-start justify-center pt-20">
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full mx-4 animate-in slide-in-from-top-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter by Category
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* All Categories Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAll();
          }}
          className={`w-full mb-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            selectedCategoryIds.length === 0
              ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          All Categories
        </button>

        {/* Category List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              data-category-button
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryToggle(category.id);
              }}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                selectedCategoryIds.includes(category.id)
                  ? "text-white ring-2 ring-offset-2 dark:ring-offset-gray-800"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              style={
                selectedCategoryIds.includes(category.id)
                  ? {
                      backgroundColor: category.color,
                      boxShadow: `0 0 0 2px ${category.color}`,
                    }
                  : {}
              }
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span>
                {selectedCategoryIds.length === 0
                  ? "Showing all workouts"
                  : `${selectedCategoryIds.length} filter${
                      selectedCategoryIds.length === 1 ? "" : "s"
                    } applied`}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
