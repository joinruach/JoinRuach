"use client";
import React from "react";
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props:any){ super(props); this.state={hasError:false}; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(err:any, info:any){ if (process.env.NODE_ENV!=="production") console.error(err, info); }
  render(){ return this.state.hasError ? (this.props.fallback ?? <div className="p-6 text-red-600">Something went wrong.</div>) : this.props.children; }
}
