'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface DataErrorBoundaryProps {
  children: ReactNode
  module: 'journal' | 'gym' | 'lexicon' | 'oracle' | 'stats' | 'generic'
  fallback?: ReactNode
}

interface DataErrorBoundaryState {
  hasError: boolean
  error: string
}

export class DataErrorBoundary extends Component<
  DataErrorBoundaryProps,
  DataErrorBoundaryState
> {
  constructor(props: DataErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): DataErrorBoundaryState {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[NEXUS ${this.props.module} Error]`, error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="data-error">
          <span className="data-error__label">
            {this.props.module.toUpperCase()} UNAVAILABLE
          </span>
          <span className="data-error__message">
            {this.state.error || 'Data could not be loaded'}
          </span>
          <button
            className="data-error__retry"
            onClick={() => this.setState({ hasError: false, error: '' })}
          >
            RETRY
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
