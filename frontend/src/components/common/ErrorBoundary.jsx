import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const errorStr = String(this.state.error?.message || this.state.error).toLowerCase()
      const isClerkError = errorStr.includes("clerk") || 
                           errorStr.includes("failed to load") ||
                           errorStr.includes("blocked_by_client")

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-6 py-12">
          <div className="bg-white p-8 rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
              <span className="text-3xl">⚠️</span>
            </div>
            
            {isClerkError ? (
              <>
                <h1 className="text-xl font-black text-[#0A1A40] mb-3">Ad-Blocker Detected</h1>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                  It looks like your ad-blocker or privacy extension is blocking the <strong>Clerk Authentication</strong> script.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl text-left text-[12px] text-gray-600 mb-6 space-y-2 border border-gray-100">
                  <p className="font-bold text-[#0A1A40]">How to fix this:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open your ad-blocker settings (e.g. uBlock Origin, Brave Shield, AdBlock).</li>
                    <li>Click <strong>Pause / Turn off</strong> for this site (localhost / emitra).</li>
                    <li>Refresh the page to continue.</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black text-[#0A1A40] mb-3">Something went wrong</h1>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                  An unexpected error occurred in the application interface.
                </p>
                <pre className="bg-slate-50 p-3 rounded-xl text-left text-[11px] text-red-500 overflow-x-auto max-h-32 mb-6 border border-gray-100">
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#164FA8] hover:bg-[#1a5ec8] text-white font-bold text-[13px] rounded-xl hover:shadow-lg transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
