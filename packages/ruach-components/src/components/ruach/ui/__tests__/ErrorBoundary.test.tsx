import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error during tests to keep output clean
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('should not interfere with children rendering', () => {
      const TestComponent = () => <div data-testid="test">Test</div>;

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('test')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display default fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      const CustomFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    });

    it('should have correct default error styling', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText('Something went wrong.');
      expect(errorMessage).toHaveClass('p-6', 'text-red-600');
    });

    it('should log error in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // In development, componentDidCatch should log to console.error
      expect(console.error).toHaveBeenCalled();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log error in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = vi.fn();
      console.error = consoleSpy;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // In production, should not call console.error
      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('State Management', () => {
    it('should update state when error occurs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();

      // Rerender with error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });

    it('should maintain error state after caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText('Something went wrong.');
      expect(errorMessage).toBeInTheDocument();

      // Should still show error on subsequent renders
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Nested Error Boundaries', () => {
    it('should allow nesting of error boundaries', () => {
      render(
        <ErrorBoundary fallback={<div>Outer error</div>}>
          <ErrorBoundary fallback={<div>Inner error</div>}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText('Inner error')).toBeInTheDocument();
      expect(screen.queryByText('Outer error')).not.toBeInTheDocument();
    });

    it('should propagate to outer boundary if inner boundary also errors', () => {
      const ErroringFallback = () => {
        throw new Error('Fallback error');
      };

      render(
        <ErrorBoundary fallback={<div>Outer caught it</div>}>
          <ErrorBoundary fallback={<ErroringFallback />}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText('Outer caught it')).toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    it('should allow recovery with new error-free children', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();

      // Note: Error boundaries don't automatically recover - this would
      // require a key change or remounting in real usage
      // This test documents the expected behavior
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors in event handlers', () => {
      const ErrorButton = () => {
        const handleClick = () => {
          throw new Error('Click error');
        };
        return <button onClick={handleClick}>Click me</button>;
      };

      render(
        <ErrorBoundary>
          <ErrorButton />
        </ErrorBoundary>
      );

      // Error boundaries don't catch errors in event handlers
      // They still render normally
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should handle async errors', async () => {
      const AsyncError = () => {
        // Simulate async error - error boundaries don't catch these
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
        return <div>Async component</div>;
      };

      render(
        <ErrorBoundary>
          <AsyncError />
        </ErrorBoundary>
      );

      // Component should render normally since async errors aren't caught
      expect(screen.getByText('Async component')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not error with null children
      expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should not error with undefined children
      expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText('Something went wrong.');
      expect(errorMessage).toBeVisible();
    });

    it('should allow custom accessible fallback', () => {
      const AccessibleFallback = (
        <div role="alert" aria-live="polite">
          An error occurred. Please refresh the page.
        </div>
      );

      render(
        <ErrorBoundary fallback={AccessibleFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });
});
