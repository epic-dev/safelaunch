import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div className="bg-panel-bg border border-border-subtle rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-outline-variant">error</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Something went wrong</h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-8">{error.message}</p>
        <button
          onClick={this.reset}
          className="bg-primary-container text-on-primary-container py-2.5 px-6 rounded font-mono-label text-mono-label hover:bg-inverse-primary transition-colors flex items-center justify-center gap-2"
        >
          Retry
        </button>
      </div>
    );
  }
}