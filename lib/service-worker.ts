// Service Worker registration and management
interface ServiceWorkerManagerInterface {
  register(): Promise<void>;
  unregister(): Promise<boolean>;
  isSupported(): boolean;
  isRegistered(): Promise<boolean>;
}

class ServiceWorkerManager implements ServiceWorkerManagerInterface {
  private registration: ServiceWorkerRegistration | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator;
  }

  async register(): Promise<void> {
    if (!this.isSupported()) {
      console.log("Service Worker: Not supported in this browser");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Service Worker: Skipping registration in development mode");
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker: Registered successfully", this.registration);

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available
              console.log("Service Worker: New version available");
              this.showUpdateNotification();
            }
          });
        }
      });

      // Handle controller change (when new service worker takes control)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker: New controller activated");
        window.location.reload();
      });
    } catch (error) {
      console.error("Service Worker: Registration failed:", error);
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const result = await registration.unregister();
        console.log("Service Worker: Unregistered successfully");
        return result;
      }
      return false;
    } catch (error) {
      console.error("Service Worker: Unregistration failed:", error);
      return false;
    }
  }

  async isRegistered(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      console.error(
        "Service Worker: Failed to check registration status:",
        error
      );
      return false;
    }
  }

  private showUpdateNotification(): void {
    // Show a notification to the user that an update is available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Workout App Update", {
        body: "A new version is available. Click to update.",
        icon: "/favicon.ico",
        tag: "workout-update",
      });
    }

    // Also show an in-app notification
    const event = new CustomEvent("serviceWorkerUpdate", {
      detail: { hasUpdate: true },
    });
    window.dispatchEvent(event);
  }

  // Get registration info
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Check if service worker is controlling the page
  isControlling(): boolean {
    return !!navigator.serviceWorker.controller;
  }

  // Get service worker state
  getState():
    | "installing"
    | "installed"
    | "activating"
    | "activated"
    | "redundant"
    | null {
    if (this.registration?.installing) return "installing";
    if (this.registration?.waiting) return "installed";
    if (this.registration?.active) return "activated";
    return null;
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register service worker when module is imported
if (typeof window !== "undefined") {
  // Register after a short delay to avoid blocking initial page load
  setTimeout(() => {
    serviceWorkerManager.register();
  }, 1000);
}
