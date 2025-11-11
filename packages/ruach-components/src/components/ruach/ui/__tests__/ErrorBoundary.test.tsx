import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import ErrorBoundary from '../ErrorBoundary';

declare global {
  // eslint-disable-next-line no-var
  var __CONSOLE_ERROR_SPY__: ReturnType<typeof vi.spyOn> | undefined;
}

const getConsoleSpy = () => {
  if (!globalThis.__CONSOLE_ERROR_SPY__) {
    throw new Error('Console spy not initialized');
  }
  return globalThis.__CONSOLE_ERROR_SPY__;
};

const renderBoundary = (
  ui: React.ReactNode = <div>Child content</div>,
  fallback?: React.ReactNode
) => {
  const ref = createRef<ErrorBoundary>();
  const utils = render(
    <ErrorBoundary ref={ref} fallback={fallback}>
      {ui}
    </ErrorBoundary>
  );

  return { ...utils, ref };
};

const triggerErrorState = (ref: React.RefObject<ErrorBoundary>) => {
  act(() => {
    ref.current?.setState({ hasError: true });
  });
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    renderBoundary(<div>Safe content</div>);

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders default fallback when an error state is triggered', () => {
    const { ref } = renderBoundary(<div>Explosive</div>);

    triggerErrorState(ref);

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText('Explosive')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error</div>;
    const { ref } = renderBoundary(<div>Explosive</div>, customFallback);

    triggerErrorState(ref);

    expect(screen.getByText('Custom error')).toBeInTheDocument();
    expect(screen.queryByText('Explosive')).not.toBeInTheDocument();
  });

  it('logs error details in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const spy = getConsoleSpy();

    const { ref } = renderBoundary();
    act(() => {
      ref.current?.componentDidCatch(new Error('dev error'), {
        componentStack: '<TestComponent />',
      });
    });

    expect(spy).toHaveBeenCalled();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('suppresses logging in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalRuntimeOverride = globalThis.__RUACH_RUNTIME_ENV__;
    process.env.NODE_ENV = 'production';
    globalThis.__RUACH_RUNTIME_ENV__ = 'production';

    const spy = getConsoleSpy();
    const { ref } = renderBoundary();

    act(() => {
      ref.current?.componentDidCatch(new Error('prod error'), {
        componentStack: '<ProdComponent />',
      });
    });

    expect(spy).not.toHaveBeenCalled();

    globalThis.__RUACH_RUNTIME_ENV__ = originalRuntimeOverride;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('maintains accessibility semantics for fallback UI', () => {
    const { ref } = renderBoundary(
      <div>Explosive</div>,
      <div role="alert">Custom failure</div>
    );

    triggerErrorState(ref);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Custom failure');
  });

  it('handles nullish children without crashing', () => {
    const { ref, rerender } = renderBoundary(null);
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();

    rerender(
      <ErrorBoundary ref={ref}>
        {undefined}
      </ErrorBoundary>
    );

    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });
});
