import { Button } from '@/components/ui/Button'
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CardápioPro ErrorBoundary]', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
          <div className="max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900/80">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Algo deu errado
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              O aplicativo encontrou um erro inesperado. Você pode tentar recarregar a página.
            </p>
            {import.meta.env.DEV && this.state.error ? (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-red-700 dark:bg-slate-800 dark:text-red-300">
                {this.state.error.message}
              </pre>
            ) : null}
            <Button
              type="button"
              className="mt-6 w-full"
              onClick={() => window.location.reload()}
            >
              Recarregar página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
