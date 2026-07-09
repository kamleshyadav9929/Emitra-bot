import React from "react"

export default function Logo({ className = "w-8 h-8", size }) {
    return (
        <img 
            src="/logo.png" 
            className={`${className} object-contain`} 
            style={size ? { width: size, height: size } : {}}
            alt="Krishna Emitra Logo" 
        />
    )
}
