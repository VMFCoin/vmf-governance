// Performance monitoring utilities for VMF Voice dApp

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

// Get rating based on metric value and thresholds
export const getRating = (
  metricName: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[metricName];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Performance observer for custom metrics
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              rating: entry.duration > 50 ? 'poor' : 'good',
              timestamp: Date.now(),
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long Task Observer not supported');
      }

      // Navigation Observer
      try {
        const navigationObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'dom-content-loaded',
              value:
                navEntry.domContentLoadedEventEnd -
                navEntry.domContentLoadedEventStart,
              rating: getRating(
                'FCP',
                navEntry.domContentLoadedEventEnd -
                  navEntry.domContentLoadedEventStart
              ),
              timestamp: Date.now(),
            });
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation Observer not supported');
      }
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.set(metric.name, metric);

    // Send to analytics if in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // In a real app, you would send this to your analytics service
    // For now, we'll just log it
    console.log('Performance Metric:', metric);

    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        custom_parameter_1: metric.timestamp,
      });
    }
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  getMetricsByRating(
    rating: 'good' | 'needs-improvement' | 'poor'
  ): PerformanceMetric[] {
    return this.getAllMetrics().filter(metric => metric.rating === rating);
  }

  // Measure custom performance
  startMeasure(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        rating:
          duration > 100
            ? 'poor'
            : duration > 50
              ? 'needs-improvement'
              : 'good',
        timestamp: Date.now(),
      });
    };
  }

  // Measure React component render time
  measureComponentRender<T extends any[]>(
    componentName: string,
    renderFn: (...args: T) => any
  ) {
    return (...args: T) => {
      const endMeasure = this.startMeasure(`${componentName}-render`);
      const result = renderFn(...args);
      endMeasure();
      return result;
    };
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals reporting function
export const reportWebVitals = (metric: WebVitalsMetric) => {
  performanceMonitor.recordMetric({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    timestamp: Date.now(),
  });
};

// Resource loading performance
export const measureResourceLoading = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  resources.forEach(resource => {
    const loadTime = resource.responseEnd - resource.startTime;

    performanceMonitor.recordMetric({
      name: `resource-load-${resource.name.split('/').pop()}`,
      value: loadTime,
      rating:
        loadTime > 1000
          ? 'poor'
          : loadTime > 500
            ? 'needs-improvement'
            : 'good',
      timestamp: Date.now(),
    });
  });
};

// Memory usage monitoring
export const measureMemoryUsage = () => {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;

  performanceMonitor.recordMetric({
    name: 'memory-used',
    value: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
    rating: memory.usedJSHeapSize > 50 * 1024 * 1024 ? 'poor' : 'good', // 50MB threshold
    timestamp: Date.now(),
  });
};

// Bundle size tracking
export const trackBundleSize = () => {
  if (typeof window === 'undefined') return;

  // Estimate bundle size from loaded scripts
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  let totalSize = 0;

  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.includes('/_next/')) {
      // This is a rough estimation - in production you'd want more accurate measurements
      totalSize += 100; // Rough estimate in KB
    }
  });

  performanceMonitor.recordMetric({
    name: 'estimated-bundle-size',
    value: totalSize,
    rating:
      totalSize > 1000
        ? 'poor'
        : totalSize > 500
          ? 'needs-improvement'
          : 'good',
    timestamp: Date.now(),
  });
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  const metrics = performanceMonitor.getAllMetrics();
  const poorMetrics = metrics.filter(m => m.rating === 'poor');

  if (poorMetrics.length > 0) {
    console.warn('Performance Budget Exceeded:', poorMetrics);
    return false;
  }

  return true;
};

// Export for use in _app.tsx
export { performanceMonitor as default };
