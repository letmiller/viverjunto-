import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-app-bg px-6 text-center">
          <span className="text-3xl">😕</span>
          <p className="text-sm font-semibold text-forest-900">Algo deu errado.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-coral-700 px-6 py-3 text-sm font-semibold text-white"
          >
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
