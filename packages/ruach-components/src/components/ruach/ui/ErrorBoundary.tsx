"use client";

import React, { type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

type MaybeNodeProcess = {
  env?: Record<string, string | undefined>;
};

declare global {
  // Custom runtime toggle so tests (and non-Next runtimes) can override NODE_ENV semantics
  // eslint-disable-next-line no-var
  var __RUACH_RUNTIME_ENV__: string | undefined;
}

const getRuntimeEnv = () => {
  const override =
    typeof globalThis !== "undefined"
      ? (
          globalThis as typeof globalThis & {
            __RUACH_RUNTIME_ENV__?: string;
          }
        ).__RUACH_RUNTIME_ENV__
      : undefined;

  if (override) {
    return override;
  }

  const runtimeProcess =
    (typeof globalThis !== "undefined" &&
      (globalThis as typeof globalThis & { process?: MaybeNodeProcess })
        .process) ||
    (typeof process !== "undefined" ? (process as MaybeNodeProcess) : undefined);

  return runtimeProcess?.env ? runtimeProcess.env["NODE_ENV"] : undefined;
};

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (getRuntimeEnv() !== "production") {
      console.error(error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-red-600">Something went wrong.</div>
        )
      );
    }

    return this.props.children;
  }
}
