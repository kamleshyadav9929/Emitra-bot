import { createContext, useContext, useState, useEffect } from "react"
import * as api from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem("student_token") || null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            if (!token) {
                setUser(null)
                setIsLoggedIn(false)
                setIsLoaded(true)
                return
            }
            try {
                const res = await api.getStudentProfile(token)
                if (res.success && res.student) {
                    setUser({
                        name: res.student.name,
                        phone: res.student.phone_number,
                        telegram_id: res.student.telegram_id,
                        exam_preference: res.student.exam_preference
                    })
                    setIsLoggedIn(true)
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
    }, [token])

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
            exam_preference: studentData.exam_preference
        })
        setIsLoggedIn(true)
    }

    const handleLogout = () => {
        localStorage.removeItem("student_token")
        setToken(null)
        setUser(null)
        setIsLoggedIn(false)
    }

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, isLoaded, login: handleLogin, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
