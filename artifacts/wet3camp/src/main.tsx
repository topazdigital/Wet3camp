import React from 'react'
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  componentDidCatch(err: Error) {
    console.error('[Wet3Camp] Render error:', err)
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          background: '#120000', color: '#fff', minHeight: '100vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '16px', fontFamily: 'sans-serif'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Something went wrong</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>Please refresh to try again</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', background: '#8B0000', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 'bold',
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID || 'xb0ksturqv'
if (clarityId) {
  import('@microsoft/clarity').then(({ default: Clarity }) => {
    Clarity.init(clarityId)
  }).catch(() => {})
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
