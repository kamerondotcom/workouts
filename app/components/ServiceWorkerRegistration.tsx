"use client";

import { useEffect } from "react";
import { serviceWorkerManager } from "@/lib/service-worker";

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    // Register service worker
    if (serviceWorkerManager.isSupported()) {
      serviceWorkerManager.register();
    }

    // Listen for service worker updates
    const handleServiceWorkerUpdate = (event: CustomEvent) => {
      if (event.detail.hasUpdate) {
        console.log("Service Worker: Update available");
        // You could show a toast notification here
      }
    };

    window.addEventListener(
      "serviceWorkerUpdate",
      handleServiceWorkerUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "serviceWorkerUpdate",
        handleServiceWorkerUpdate as EventListener
      );
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ServiceWorkerRegistration;
