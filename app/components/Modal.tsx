"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Gentle focus management - only trap focus at modal boundaries
    const timeoutId = null;

    // Focus trapping that only prevents tabbing out of modal
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      // Only trap at the actual boundaries
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
      // Otherwise, let normal tab behavior work
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscKey);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    // Store current scroll position to preserve it
    const currentScrollY = window.scrollY;
    document.body.style.top = `-${currentScrollY}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("keydown", handleEscKey);

      // Restore body styles and scroll position
      document.body.style.overflow = "";
      document.body.style.top = "";
      document.body.style.position = "";
      document.body.style.width = "";

      // Restore scroll position
      window.scrollTo(0, currentScrollY);

      // Restore focus gently after a delay
      setTimeout(() => {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 100);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[200] p-4 pt-16 overflow-y-auto"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transform: "translateZ(0)", // Force hardware acceleration
        WebkitTransform: "translateZ(0)",
        // Prevent viewport changes on mobile
        height: "100dvh", // Dynamic viewport height
        width: "100dvw", // Dynamic viewport width
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={(e) => {
        // Prevent touch events from bubbling to elements behind the modal
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        // Prevent touch events from bubbling to elements behind the modal
        e.stopPropagation();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full my-4 pb-safe`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2
              id="modal-title"
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  // Render modal in a portal to avoid DOM tree issues
  return createPortal(modalContent, document.body);
}
