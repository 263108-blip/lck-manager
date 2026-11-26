import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class RenderErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render failed', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', padding: 32, background: '#0a0e15', color: '#ffb4b4', fontFamily: 'monospace' }}>
          <h1>앱 렌더링 오류</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.stack || this.state.error.message}</pre>
        </main>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RenderErrorBoundary>
      <App />
    </RenderErrorBoundary>
  </StrictMode>,
)
