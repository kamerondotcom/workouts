import { useEffect, useState } from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const measurePerformance = () => {
      if (typeof window !== "undefined" && "performance" in window) {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType("paint");

        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const renderTime =
          paint.find((entry) => entry.name === "first-contentful-paint")
            ?.startTime || 0;

        // Memory usage (if available)
        const memory = (performance as any).memory;
        const memoryUsage = memory
          ? memory.usedJSHeapSize / 1024 / 1024
          : undefined;

        setMetrics({
          loadTime,
          renderTime,
          memoryUsage,
        });

        // Log performance metrics
        console.log("🚀 Performance Metrics:", {
          loadTime: `${loadTime.toFixed(2)}ms`,
          renderTime: `${renderTime.toFixed(2)}ms`,
          memoryUsage: memoryUsage ? `${memoryUsage.toFixed(2)}MB` : "N/A",
        });
      }
    };

    // Measure after component mount
    const timer = setTimeout(measurePerformance, 100);

    return () => clearTimeout(timer);
  }, []);

  return metrics;
}
