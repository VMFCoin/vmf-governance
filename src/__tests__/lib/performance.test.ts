import {
  PerformanceMonitor,
  getRating,
  performanceMonitor,
  measureResourceLoading,
  measureMemoryUsage,
  checkPerformanceBudget,
} from '@/lib/performance';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => 1000),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 25 * 1024 * 1024, // 25MB
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(callback => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRating', () => {
    it('returns good rating for values within good threshold', () => {
      expect(getRating('CLS', 0.05)).toBe('good');
      expect(getRating('FID', 50)).toBe('good');
      expect(getRating('LCP', 2000)).toBe('good');
    });

    it('returns needs-improvement rating for values within poor threshold', () => {
      expect(getRating('CLS', 0.15)).toBe('needs-improvement');
      expect(getRating('FID', 200)).toBe('needs-improvement');
      expect(getRating('LCP', 3000)).toBe('needs-improvement');
    });

    it('returns poor rating for values above poor threshold', () => {
      expect(getRating('CLS', 0.3)).toBe('poor');
      expect(getRating('FID', 400)).toBe('poor');
      expect(getRating('LCP', 5000)).toBe('poor');
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    afterEach(() => {
      monitor.disconnect();
    });

    it('records metrics correctly', () => {
      const metric = {
        name: 'test-metric',
        value: 100,
        rating: 'good' as const,
        timestamp: Date.now(),
      };

      monitor.recordMetric(metric);
      expect(monitor.getMetric('test-metric')).toEqual(metric);
    });

    it('gets all metrics', () => {
      const metric1 = {
        name: 'metric-1',
        value: 100,
        rating: 'good' as const,
        timestamp: Date.now(),
      };

      const metric2 = {
        name: 'metric-2',
        value: 200,
        rating: 'poor' as const,
        timestamp: Date.now(),
      };

      monitor.recordMetric(metric1);
      monitor.recordMetric(metric2);

      const allMetrics = monitor.getAllMetrics();
      expect(allMetrics).toHaveLength(2);
      expect(allMetrics).toContainEqual(metric1);
      expect(allMetrics).toContainEqual(metric2);
    });

    it('filters metrics by rating', () => {
      const goodMetric = {
        name: 'good-metric',
        value: 50,
        rating: 'good' as const,
        timestamp: Date.now(),
      };

      const poorMetric = {
        name: 'poor-metric',
        value: 500,
        rating: 'poor' as const,
        timestamp: Date.now(),
      };

      monitor.recordMetric(goodMetric);
      monitor.recordMetric(poorMetric);

      const goodMetrics = monitor.getMetricsByRating('good');
      const poorMetrics = monitor.getMetricsByRating('poor');

      expect(goodMetrics).toHaveLength(1);
      expect(goodMetrics[0]).toEqual(goodMetric);
      expect(poorMetrics).toHaveLength(1);
      expect(poorMetrics[0]).toEqual(poorMetric);
    });

    it('measures custom performance', () => {
      const endMeasure = monitor.startMeasure('custom-operation');

      // Simulate some work
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1150);

      endMeasure();

      const metric = monitor.getMetric('custom-operation');
      expect(metric).toBeDefined();
      expect(metric?.value).toBe(150);
      expect(metric?.rating).toBe('poor'); // > 100ms
    });

    it('measures component render time', () => {
      const mockRenderFn = jest.fn(() => 'rendered');
      const measuredRender = monitor.measureComponentRender(
        'TestComponent',
        mockRenderFn
      );

      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1030);

      const result = measuredRender('arg1', 'arg2');

      expect(result).toBe('rendered');
      expect(mockRenderFn).toHaveBeenCalledWith('arg1', 'arg2');

      const metric = monitor.getMetric('TestComponent-render');
      expect(metric).toBeDefined();
      expect(metric?.value).toBe(30);
      expect(metric?.rating).toBe('good'); // < 50ms
    });
  });

  describe('measureResourceLoading', () => {
    it('measures resource loading performance', () => {
      const mockResources = [
        {
          name: 'https://example.com/script.js',
          startTime: 100,
          responseEnd: 600,
        },
        {
          name: 'https://example.com/style.css',
          startTime: 200,
          responseEnd: 400,
        },
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      measureResourceLoading();

      const scriptMetric = performanceMonitor.getMetric(
        'resource-load-script.js'
      );
      const styleMetric = performanceMonitor.getMetric(
        'resource-load-style.css'
      );

      expect(scriptMetric).toBeDefined();
      expect(scriptMetric?.value).toBe(500);
      expect(scriptMetric?.rating).toBe('needs-improvement'); // 500ms

      expect(styleMetric).toBeDefined();
      expect(styleMetric?.value).toBe(200);
      expect(styleMetric?.rating).toBe('good'); // 200ms
    });
  });

  describe('measureMemoryUsage', () => {
    it('measures memory usage when available', () => {
      measureMemoryUsage();

      const memoryMetric = performanceMonitor.getMetric('memory-used');
      expect(memoryMetric).toBeDefined();
      expect(memoryMetric?.value).toBe(25); // 25MB
      expect(memoryMetric?.rating).toBe('good'); // < 50MB
    });

    it('handles missing memory API gracefully', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      expect(() => measureMemoryUsage()).not.toThrow();

      (performance as any).memory = originalMemory;
    });
  });

  describe('checkPerformanceBudget', () => {
    it('returns true when no poor metrics exist', () => {
      performanceMonitor.recordMetric({
        name: 'good-metric',
        value: 50,
        rating: 'good',
        timestamp: Date.now(),
      });

      expect(checkPerformanceBudget()).toBe(true);
    });

    it('returns false when poor metrics exist', () => {
      performanceMonitor.recordMetric({
        name: 'poor-metric',
        value: 500,
        rating: 'poor',
        timestamp: Date.now(),
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(checkPerformanceBudget()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance Budget Exceeded:',
        expect.any(Array)
      );

      consoleSpy.mockRestore();
    });
  });
});
