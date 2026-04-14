// AuthContext.jsx — now a thin re-export shim over Clerk so all existing
// consumer components (Landing, ServicesPage, StudentProfileDrawer, LandingBottomNav)
// continue to call `useAuth()` without any changes to their import lines.
//
// Shape returned:
//   { user: { name, email, imageUrl, phone },  isLoggedIn, logout }

import { useUser, useClerk } from "@clerk/react"

export function useAuth() {
    const { user: clerkUser, isSignedIn, isLoaded } = useUser()
    const { signOut } = useClerk()

    const user = isSignedIn
        ? {
              name:     clerkUser.fullName || clerkUser.firstName || clerkUser.username || "Student",
              email:    clerkUser.primaryEmailAddress?.emailAddress || "",
              imageUrl: clerkUser.imageUrl || "",
              phone:    clerkUser.primaryPhoneNumber?.phoneNumber || "",
          }
        : null

    return {
        user,
        isLoggedIn: !!isSignedIn && isLoaded,
        logout: () => signOut(),
    }
}

// AuthProvider is no longer needed (Clerk manages state globally via ClerkProvider
// in main.jsx), but we keep the export so App.jsx doesn't need editing yet.
export function AuthProvider({ children }) {
    return children
}
