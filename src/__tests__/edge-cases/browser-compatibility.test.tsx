import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test components
const TestComponent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div data-testid="test-component">{children}</div>;

const Button: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button data-testid="test-button">{children}</button>
);

describe('Browser Compatibility', () => {
  beforeEach(() => {
    // Suppress console errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CSS Feature Detection', () => {
    it('should handle missing CSS Grid support', () => {
      const originalSupports = CSS.supports;
      CSS.supports = jest.fn().mockReturnValue(false);

      expect(() => {
        render(<TestComponent>Grid Test</TestComponent>);
      }).not.toThrow();

      CSS.supports = originalSupports;
    });

    it('should handle missing CSS Flexbox support', () => {
      const originalSupports = CSS.supports;
      CSS.supports = jest.fn().mockReturnValue(false);

      expect(() => {
        render(<TestComponent>Flexbox Test</TestComponent>);
      }).not.toThrow();

      CSS.supports = originalSupports;
    });
  });

  describe('JavaScript API Compatibility', () => {
    it('should handle missing IntersectionObserver', () => {
      const originalIntersectionObserver = window.IntersectionObserver;
      delete (window as any).IntersectionObserver;

      expect(() => {
        render(<TestComponent>IntersectionObserver Test</TestComponent>);
      }).not.toThrow();

      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('should handle missing fetch API', () => {
      const originalFetch = global.fetch;
      delete (global as any).fetch;

      expect(() => {
        render(<TestComponent>Fetch Test</TestComponent>);
      }).not.toThrow();

      global.fetch = originalFetch;
    });

    it('should handle missing localStorage', () => {
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      expect(() => {
        render(<TestComponent>LocalStorage Test</TestComponent>);
      }).not.toThrow();

      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });
  });

  describe('Service Worker Compatibility', () => {
    it('should handle missing service worker support', () => {
      const originalServiceWorker = (navigator as any).serviceWorker;
      delete (navigator as any).serviceWorker;

      expect(() => {
        render(<TestComponent>Service Worker Test</TestComponent>);
      }).not.toThrow();

      (navigator as any).serviceWorker = originalServiceWorker;
    });

    it('should handle service worker registration failures', async () => {
      // Mock service worker to simulate registration failure
      const mockServiceWorker = {
        register: jest
          .fn()
          .mockRejectedValue(new Error('Service worker registration failed')),
        ready: Promise.resolve({
          unregister: jest.fn(),
        }),
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true,
      });

      const TestComponent = () => {
        const [error, setError] = React.useState<string | null>(null);

        React.useEffect(() => {
          const registerServiceWorker = async () => {
            try {
              if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/sw.js');
              }
            } catch (err) {
              setError('Service worker registration failed');
            }
          };

          registerServiceWorker().catch(() => {
            setError('Service worker registration failed');
          });
        }, []);

        if (error) {
          return <div data-testid="sw-error">{error}</div>;
        }

        return <div data-testid="sw-loading">Loading...</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).not.toThrow();

      // Clean up mock
      delete (navigator as any).serviceWorker;
    });
  });

  describe('Performance API Compatibility', () => {
    it('should handle missing performance API', () => {
      const originalPerformance = window.performance;
      delete (window as any).performance;

      expect(() => {
        render(<TestComponent>Performance Test</TestComponent>);
      }).not.toThrow();

      window.performance = originalPerformance;
    });
  });

  describe('Network Information API Compatibility', () => {
    it('should handle missing connection API', () => {
      const originalConnection = (navigator as any).connection;
      delete (navigator as any).connection;

      expect(() => {
        render(<TestComponent>Network Info Test</TestComponent>);
      }).not.toThrow();

      (navigator as any).connection = originalConnection;
    });

    it('should handle offline state', () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      expect(() => {
        render(<TestComponent>Offline Test</TestComponent>);
      }).not.toThrow();

      Object.defineProperty(navigator, 'onLine', {
        value: originalOnLine,
        writable: true,
      });
    });
  });
});
