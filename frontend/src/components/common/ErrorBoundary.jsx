import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
            <h2 className="text-red-400 font-bold text-lg mb-3">Une erreur est survenue</h2>
            <p className="text-slate-300 text-sm mb-2 break-words">{this.state.error?.name}</p>
            <p className="text-slate-400 text-xs break-words">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()}
              className="mt-4 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold">
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
