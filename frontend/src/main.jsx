import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ClerkProvider } from '@clerk/react'
import App from './App.jsx'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk publishable key. Add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env')
}

// Global Clerk appearance — applied to both the student portal modal
// and the admin /login page's <SignIn> component.
const clerkAppearance = {
  variables: {
    colorPrimary:       '#164FA8',
    colorText:          '#0A1A40',
    colorTextSecondary: '#6b7280',
    colorBackground:    '#ffffff',
    colorInputBackground: '#f8fafc',
    borderRadius:       '14px',
    fontFamily:         'Inter, system-ui, sans-serif',
    fontSize:           '14px',
  },
  elements: {
    // Card / modal shell
    card:                    'shadow-2xl rounded-[24px] border-0 overflow-hidden',
    // Header
    headerTitle:             'font-black text-[#0A1A40] text-[20px] tracking-tight',
    headerSubtitle:          'text-gray-500 text-[13px]',
    // Social buttons
    socialButtonsBlockButton:
      'border border-gray-200 rounded-[12px] font-bold text-[13px] text-gray-700 hover:bg-gray-50 transition-all h-11 shadow-none',
    socialButtonsBlockButtonText: 'font-bold text-[13px]',
    // Divider
    dividerLine:             'bg-gray-200',
    dividerText:             'text-gray-400 text-[11px] font-bold tracking-widest uppercase',
    // Form fields
    formFieldLabel:          'text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-1',
    formFieldInput:
      'bg-[#f8fafc] border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#0A1A40] placeholder:text-gray-400 focus:ring-2 focus:ring-[#164FA8]/20 focus:border-[#164FA8] transition-all shadow-none outline-none',
    // Primary action button
    formButtonPrimary:
      'bg-gradient-to-br from-[#164FA8] to-[#1a5ec8] text-white font-bold text-[13px] py-3 rounded-[12px] hover:shadow-lg hover:-translate-y-0.5 transition-all normal-case w-full',
    // Footer links
    footerActionLink:        'text-[#164FA8] font-bold hover:underline',
    footerActionText:        'text-gray-400 text-[12px]',
    // Error / alert
    formFieldErrorText:      'text-red-500 text-[11px] font-bold mt-1',
    alert:                   'rounded-[12px] text-[12px]',
    alertText:               'text-[12px]',
    // Identity preview
    identityPreviewText:     'text-[13px] text-gray-700',
    identityPreviewEditButton: 'text-[#164FA8]',
    // Internal card box (Clerk wraps SignIn in a cardBox inside modal)
    cardBox:                 'shadow-none',
  },
  layout: {
    socialButtonsPlacement: 'top',
    logoPlacement:          'none',
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      afterSignOutUrl="/login"
      appearance={clerkAppearance}
    >
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
