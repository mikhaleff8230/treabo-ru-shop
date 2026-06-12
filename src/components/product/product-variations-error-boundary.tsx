import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ProductVariationsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ProductVariationsErrorBoundary] Caught error:', error);
    console.error('[ProductVariationsErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Не показываем ошибку пользователю, просто не рендерим компонент
      console.error('[ProductVariationsErrorBoundary] Error caught, component will not render');
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

