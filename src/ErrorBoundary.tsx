import { Component, type ReactNode } from 'react'

type Props = {
  fallback: ReactNode
  children: ReactNode
  // Notified when a render error is caught (e.g. to report it to telemetry).
  onError?: (error: unknown) => void
}
type State = { hasError: boolean }

// Catches render-time errors from a remote (e.g. its remoteEntry.js failing to
// load) so one downed micro-frontend shows a local fallback instead of taking
// the whole shell down with it.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('A remote failed to render:', error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
