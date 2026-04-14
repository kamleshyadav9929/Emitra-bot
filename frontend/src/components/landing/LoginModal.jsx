// LoginModal — triggers Clerk's native sign-in modal.
// Keeps the same { isOpen, onClose } API so Landing.jsx / ServicesPage.jsx
// don't need any changes.

import { useEffect } from "react"
import { useClerk, useAuth } from "@clerk/react"

export default function LoginModal({ isOpen, onClose }) {
    const { openSignIn } = useClerk()
    const { isSignedIn } = useAuth()

    useEffect(() => {
        if (isOpen) {
            // Close any custom wrapper logic, let Clerk take over
            onClose()
            openSignIn({
                // After sign-in, stay on the current page
                afterSignInUrl: window.location.href,
                afterSignUpUrl: window.location.href,
            })
        }
    }, [isOpen])

    // Clerk renders its own fully-styled modal overlay — no JSX needed here
    return null
}
