import { createContext, useContext, useState, useEffect } from "react"
import { useAuth as useClerkAuth, useUser } from "@clerk/react"
import * as api from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const { isSignedIn: isClerkSignedIn, isLoaded: isClerkLoaded, signOut, getToken } = useClerkAuth()
    const { user: clerkUser } = useUser()

    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem("student_token") || null)
    const [isLocalLoggedIn, setIsLocalLoggedIn] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load student profile if token is present
    useEffect(() => {
        const loadProfile = async () => {
            if (!token) {
                setUser(null)
                setIsLocalLoggedIn(false)
                if (isClerkLoaded) {
                    setIsLoaded(true)
                }
                return
            }
            try {
                const res = await api.getStudentProfile(token)
                if (res.success && res.student) {
                    setUser({
                        name: res.student.name,
                        phone: res.student.phone_number,
                        telegram_id: res.student.telegram_id,
                        exam_preference: res.student.exam_preference,
                        exam_preferences: res.student.exam_preferences || []
                    })
                    setIsLocalLoggedIn(true)
                } else {
                    handleLogout()
                }
            } catch (err) {
                console.error("Failed to load student profile", err)
                handleLogout()
            } finally {
                setIsLoaded(true)
            }
        }
        loadProfile()
    }, [token, isClerkLoaded])

    // Monitor Clerk session as a secondary login
    useEffect(() => {
        const syncClerkSession = async () => {
            if (isClerkSignedIn && clerkUser && !token) {
                const email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() || ""
                const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
                    .split(",")
                    .map(e => e.trim().toLowerCase())
                    .filter(Boolean)
                
                const isAdmin = adminEmails.includes(email)
                
                if (!isAdmin) {
                    try {
                        const name = clerkUser.fullName || clerkUser.username || "Student"
                        const phone = clerkUser.primaryPhoneNumber?.phoneNumber || ""
                        const clerkToken = await getToken()
                        
                        // Sync Clerk user with Supabase database
                        const res = await api.syncClerkStudent(clerkToken, { email, phone, name })
                        if (res.success && res.user) {
                            setUser({
                                name: res.user.name,
                                phone: res.user.phone_number,
                                telegram_id: res.user.telegram_id,
                                email: email,
                                exam_preference: res.user.exam_preference || "NONE",
                                exam_preferences: res.user.exam_preferences || []
                            })
                        } else {
                            // Fallback to local Clerk details
                            setUser({
                                name,
                                phone,
                                email,
                                telegram_id: null,
                                exam_preference: "NONE",
                                exam_preferences: []
                            })
                        }
                    } catch (err) {
                        console.error("Clerk sync failed", err)
                        // Fallback to local Clerk details
                        setUser({
                            name: clerkUser.fullName || clerkUser.username || "Student",
                            phone: clerkUser.primaryPhoneNumber?.phoneNumber || "",
                            email: email,
                            telegram_id: null,
                            exam_preference: "NONE",
                            exam_preferences: []
                        })
                    }
                    setIsLocalLoggedIn(true)
                }
            }
            if (!isClerkSignedIn && !token) {
                setIsLocalLoggedIn(false)
                setUser(null)
            }
            setIsLoaded(true)
        }

        if (isClerkLoaded) {
            syncClerkSession()
        }
    }, [isClerkSignedIn, clerkUser, isClerkLoaded, token, getToken])

    const handleLogin = (newToken, studentData) => {
        localStorage.setItem("student_token", newToken)
        if (studentData.phone_number) {
            localStorage.setItem("phone_emitra", studentData.phone_number)
        }
        setToken(newToken)
        setUser({
            name: studentData.name,
            phone: studentData.phone_number,
            telegram_id: studentData.telegram_id,
            exam_preference: studentData.exam_preference,
            exam_preferences: studentData.exam_preferences || []
        })
        setIsLocalLoggedIn(true)
    }

    const handleLogout = async () => {
        localStorage.removeItem("student_token")
        setToken(null)
        setUser(null)
        setIsLocalLoggedIn(false)
        if (isClerkSignedIn) {
            try {
                await signOut()
            } catch (err) {
                console.error("Clerk signout failed", err)
            }
        }
    }

    const isLoggedIn = isLocalLoggedIn || (isClerkSignedIn && user && !token)
    const needsOnboarding = isLoggedIn && user && (!user.exam_preferences || user.exam_preferences.length === 0)

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, needsOnboarding, isLoaded: isLoaded && isClerkLoaded, login: handleLogin, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
