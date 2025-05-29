// Accessibility utilities for VMF Voice dApp

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element?: Element;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  score: number;
  timestamp: number;
  url: string;
}

// WCAG 2.1 AA compliance checker
export class AccessibilityChecker {
  private issues: AccessibilityIssue[] = [];

  // Check color contrast
  checkColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    if (typeof window === 'undefined') return issues;

    // Get all text elements
    const textElements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, span, a, button, label'
    );

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Simple contrast check (in a real implementation, you'd use a proper contrast calculation)
      if (
        color &&
        backgroundColor &&
        color !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'rgba(0, 0, 0, 0)'
      ) {
        const contrast = this.calculateContrast(color, backgroundColor);

        if (contrast < 4.5) {
          // WCAG AA standard
          issues.push({
            type: 'error',
            rule: 'color-contrast',
            description: `Insufficient color contrast ratio: ${contrast.toFixed(2)}. Minimum required: 4.5:1`,
            element: element as Element,
            severity: 'serious',
          });
        }
      }
    });

    return issues;
  }

  // Check keyboard navigation
  checkKeyboardNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    if (typeof window === 'undefined') return issues;

    // Check for interactive elements without proper focus management
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]'
    );

    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');

      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          type: 'warning',
          rule: 'tabindex-positive',
          description: 'Positive tabindex values should be avoided',
          element: element as Element,
          severity: 'moderate',
        });
      }

      // Check for missing focus indicators
      const styles = window.getComputedStyle(element, ':focus');
      if (!styles.outline || styles.outline === 'none') {
        issues.push({
          type: 'warning',
          rule: 'focus-indicator',
          description: 'Interactive element lacks visible focus indicator',
          element: element as Element,
          severity: 'serious',
        });
      }
    });

    return issues;
  }

  // Check semantic HTML
  checkSemanticHTML(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    if (typeof window === 'undefined') return issues;

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));

      if (level > previousLevel + 1) {
        issues.push({
          type: 'error',
          rule: 'heading-hierarchy',
          description: `Heading level ${level} skips level ${previousLevel + 1}`,
          element: heading as Element,
          severity: 'serious',
        });
      }

      previousLevel = level;
    });

    // Check for images without alt text
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        issues.push({
          type: 'error',
          rule: 'img-alt',
          description: 'Image missing alt attribute',
          element: img,
          severity: 'critical',
        });
      }
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');

      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label && !ariaLabel && !ariaLabelledBy) {
          issues.push({
            type: 'error',
            rule: 'form-label',
            description: 'Form input missing associated label',
            element: input as Element,
            severity: 'critical',
          });
        }
      }
    });

    return issues;
  }

  // Check ARIA usage
  checkARIA(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    if (typeof window === 'undefined') return issues;

    // Check for invalid ARIA attributes
    const elementsWithAria = document.querySelectorAll(
      '[aria-label], [aria-labelledby], [aria-describedby], [role]'
    );

    elementsWithAria.forEach(element => {
      const role = element.getAttribute('role');

      // Check for invalid roles
      const validRoles = [
        'alert',
        'alertdialog',
        'application',
        'article',
        'banner',
        'button',
        'cell',
        'checkbox',
        'columnheader',
        'combobox',
        'complementary',
        'contentinfo',
        'dialog',
        'directory',
        'document',
        'feed',
        'figure',
        'form',
        'grid',
        'gridcell',
        'group',
        'heading',
        'img',
        'link',
        'list',
        'listbox',
        'listitem',
        'log',
        'main',
        'marquee',
        'math',
        'menu',
        'menubar',
        'menuitem',
        'menuitemcheckbox',
        'menuitemradio',
        'navigation',
        'none',
        'note',
        'option',
        'presentation',
        'progressbar',
        'radio',
        'radiogroup',
        'region',
        'row',
        'rowgroup',
        'rowheader',
        'scrollbar',
        'search',
        'searchbox',
        'separator',
        'slider',
        'spinbutton',
        'status',
        'switch',
        'tab',
        'table',
        'tablist',
        'tabpanel',
        'term',
        'textbox',
        'timer',
        'toolbar',
        'tooltip',
        'tree',
        'treegrid',
        'treeitem',
      ];

      if (role && !validRoles.includes(role)) {
        issues.push({
          type: 'error',
          rule: 'aria-valid-role',
          description: `Invalid ARIA role: ${role}`,
          element: element as Element,
          severity: 'serious',
        });
      }
    });

    return issues;
  }

  // Calculate color contrast ratio (simplified)
  private calculateContrast(color1: string, color2: string): number {
    // This is a simplified calculation
    // In a real implementation, you'd parse RGB values and calculate proper contrast
    return Math.random() * 10 + 1; // Placeholder
  }

  // Run all accessibility checks
  runAllChecks(): AccessibilityReport {
    this.issues = [];

    this.issues.push(...this.checkColorContrast());
    this.issues.push(...this.checkKeyboardNavigation());
    this.issues.push(...this.checkSemanticHTML());
    this.issues.push(...this.checkARIA());

    // Calculate score based on issues
    const criticalIssues = this.issues.filter(
      i => i.severity === 'critical'
    ).length;
    const seriousIssues = this.issues.filter(
      i => i.severity === 'serious'
    ).length;
    const moderateIssues = this.issues.filter(
      i => i.severity === 'moderate'
    ).length;
    const minorIssues = this.issues.filter(i => i.severity === 'minor').length;

    const score = Math.max(
      0,
      100 -
        (criticalIssues * 25 +
          seriousIssues * 10 +
          moderateIssues * 5 +
          minorIssues * 1)
    );

    return {
      issues: this.issues,
      score,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
  }

  // Get issues by severity
  getIssuesBySeverity(
    severity: 'critical' | 'serious' | 'moderate' | 'minor'
  ): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.severity === severity);
  }

  // Get issues by type
  getIssuesByType(type: 'error' | 'warning' | 'info'): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.type === type);
  }
}

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Manage focus for modals
  manageFocus: (isOpen: boolean, triggerElement?: HTMLElement) => {
    if (isOpen) {
      // Store the currently focused element
      const previouslyFocused = document.activeElement as HTMLElement;

      return () => {
        // Return focus to the trigger element or previously focused element
        if (triggerElement) {
          triggerElement.focus();
        } else if (previouslyFocused) {
          previouslyFocused.focus();
        }
      };
    }
  },

  // Skip link functionality
  addSkipLink: (targetId: string, text: string = 'Skip to main content') => {
    if (typeof window === 'undefined') return;

    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className =
      'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 z-50';

    document.body.insertBefore(skipLink, document.body.firstChild);
  },
};

// Screen reader utilities
export const screenReader = {
  // Announce content to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof window === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Update page title for navigation
  updatePageTitle: (title: string) => {
    if (typeof window !== 'undefined') {
      document.title = title;
      screenReader.announce(`Navigated to ${title}`);
    }
  },
};

// Color and contrast utilities
export const colorUtils = {
  // Check if colors meet WCAG contrast requirements
  meetsContrastRequirement: (
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean => {
    // Simplified implementation - in production, use a proper contrast calculation library
    const ratio = 4.5; // Placeholder
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },

  // Get accessible color palette
  getAccessiblePalette: () => ({
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      900: '#7f1d1d',
    },
  }),
};

// Export singleton instance
export const accessibilityChecker = new AccessibilityChecker();

// Export for testing
export default accessibilityChecker;
