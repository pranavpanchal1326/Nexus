import { Component, type ReactNode, type ErrorInfo } from 'react'

interface SceneErrorBoundaryProps {
  children: ReactNode
}

interface SceneErrorBoundaryState {
  hasError:     boolean
  errorMessage: string
}

export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return {
      hasError:     true,
      errorMessage: error.message,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production — silent. In development — inform.
    if (process.env.NODE_ENV === 'development') {
      console.error('[NEXUS SceneError]', error.message, info.componentStack)
    }

    // Future: send to error tracking (Sentry, etc.)
    // reportSceneError(error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Silent geometric fallback — never show a red error box
      return (
        <div className="scene-fallback scene-fallback--error">
          <div className="scene-error-geo" aria-hidden="true">
            <span className="scene-unsupported-char">◇</span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
