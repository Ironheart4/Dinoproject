// ErrorBoundary.tsx — Global Error Handler for React Components
// ============================================================
// PURPOSE: Catches JavaScript errors anywhere in the child component tree
// FEATURES:
// - Prevents entire app from crashing on errors
// - Shows friendly "Something went extinct" error UI
// - Provides "Try Again" button to reset and retry
// - Collapsible technical details for debugging
// - Optional custom fallback UI via props
//
// USAGE:
// <ErrorBoundary>
//   <App />
// </ErrorBoundary>
//
// Or with custom fallback:
// <ErrorBoundary fallback={<CustomErrorPage />}>
//   <RiskyComponent />
// </ErrorBoundary>
//
// NOTE: Error boundaries only catch errors in:
// - Render methods
// - Lifecycle methods  
// - Constructors of child components
// They do NOT catch errors in event handlers, async code, or SSR
// ============================================================
import { Component, ErrorInfo, ReactNode } from 'react'
import { Link } from 'react-router-dom'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Props for ErrorBoundary component */
interface Props {
  children: ReactNode      // Child components to wrap
  fallback?: ReactNode     // Optional custom error UI
}

/** Internal state for error tracking */
interface State {
  hasError: boolean        // Whether an error has occurred
  error: Error | null      // The error object (for technical details)
  errorInfo: ErrorInfo | null  // React component stack info
}

// ============================================================
// ERROR BOUNDARY COMPONENT (Class-based - required for error boundaries)
// ============================================================

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  /**
   * Called when an error is thrown in a descendant component
   * Updates state to trigger error UI render
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  /**
   * Called after an error is caught - used for logging
   * @param error - The error that was thrown
   * @param errorInfo - React component stack trace
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging (could also send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  /**
   * Reset error state to allow retry
   * Called when user clicks "Try Again" button
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    // If error occurred, show error UI
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default friendly error UI
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            {/* Animated dinosaur emoji */}
            <div className="text-8xl mb-6 animate-bounce">🦖</div>
            
            {/* Error title - dinosaur themed */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Oops! Something went extinct...
            </h1>
            
            {/* Friendly error message */}
            <p className="text-gray-400 mb-6">
              Don't worry, it's not the asteroid! We encountered an unexpected error.
              Our paleontologists are investigating.
            </p>

            {/* Collapsible technical details for debugging */}
            {this.state.error && (
              <details className="mb-6 text-left bg-gray-800 rounded-lg p-4">
                <summary className="text-gray-300 cursor-pointer hover:text-white">
                  Technical Details
                </summary>
                <pre className="mt-3 text-xs text-red-400 overflow-auto p-2 bg-gray-900 rounded">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Try Again
              </button>
              <Link
                to="/home"
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
