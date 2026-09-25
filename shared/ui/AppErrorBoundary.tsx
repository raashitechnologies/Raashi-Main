import React, { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "public" | "admin";
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error internally, but NOT to the screen to avoid leaking stack traces
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleRetry = () => {
    const RELOAD_KEY = "app_reload_count";
    const reloadCount = parseInt(sessionStorage.getItem(RELOAD_KEY) || "0", 10);
    
    // Prevent infinite reload loops
    if (reloadCount < 2) {
      sessionStorage.setItem(RELOAD_KEY, (reloadCount + 1).toString());
      window.location.reload();
    } else {
      // Loop protection: reset count and fallback to navigation
      sessionStorage.removeItem(RELOAD_KEY);
      const isAdmin = this.props.variant === "admin";
      window.location.href = isAdmin ? "/admin/dashboard" : "/";
    }
  };

  render() {
    if (this.state.hasError) {
      const isAdmin = this.props.variant === "admin";
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center" role="alert">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            {isAdmin 
              ? "This part of the dashboard couldn't be loaded. Your saved data is safe."
              : "We couldn't load this page properly."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-blue text-white hover:bg-brand-royal transition-colors shadow-sm"
            >
              Try Again
            </button>
            <button 
              onClick={() => {
                sessionStorage.removeItem("app_reload_count");
                window.location.href = isAdmin ? "/admin/dashboard" : "/";
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {isAdmin ? "Go to Dashboard" : "Back to Home"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
