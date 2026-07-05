import React from "react"

export default function Logo({ className = "w-8 h-8", size = 32 }) {
    return (
        <svg 
            className={className} 
            width={size} 
            height={size} 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" />
                    <stop offset="100%" stopColor="var(--color-primary-container, #1d4ed8)" />
                </linearGradient>
            </defs>
            {/* Sleek rounded square container with gradient background */}
            <rect x="2" y="2" width="28" height="28" rx="8.5" fill="url(#logoGrad)" />
            {/* Minimalist geometric K monogram */}
            <path 
                d="M9 8V24M9 16H14.5L18.5 8M14.5 16L19.5 24" 
                stroke="white" 
                strokeWidth="2.8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            {/* Minimalist geometric e monogram */}
            <path 
                d="M23 11.5C20.5 11.5 18.5 13.5 18.5 16C18.5 18.5 20.5 20.5 23 20.5C25.2 20.5 25.5 19 25.5 19H19" 
                stroke="white" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </svg>
    )
}
