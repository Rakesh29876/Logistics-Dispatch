import React from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      const fallbackTitle = this.props.title || 'Component Render Error'
      return (
        <div
          style={{
            padding: '32px 24px',
            margin: '20px auto',
            maxWidth: '720px',
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            textAlign: 'center',
            color: 'var(--text-primary, #0f172a)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>
            {fallbackTitle}
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            An unexpected error occurred while rendering this module. You can try reloading the component or navigating back to the Operations Dashboard.
          </p>

          {this.state.error && (
            <div
              style={{
                textAlign: 'left',
                background: 'rgba(15, 23, 42, 0.04)',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#dc2626',
                marginBottom: '20px',
                maxHeight: '120px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '6px',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry Render</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '6px',
              }}
            >
              <RefreshCw size={14} />
              <span>Reload Control Tower</span>
            </button>

            {this.props.onGoHome && (
              <button
                type="button"
                onClick={this.props.onGoHome}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                <LayoutDashboard size={14} />
                <span>Return to Overview</span>
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
