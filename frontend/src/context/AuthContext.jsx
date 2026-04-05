import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("emitra_student")
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })

    const login = (phone, name) => {
        const userData = { phone, name, isLoggedIn: true }
        localStorage.setItem("emitra_student", JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem("emitra_student")
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
