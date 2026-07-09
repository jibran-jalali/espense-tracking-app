import { useState, useEffect, createContext, useContext } from 'react'
import { authApi, setAuthToken, getAuthToken } from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  currency: string
  is_admin?: boolean
  features?: Record<string, boolean>
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, name: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const data = await authApi.login(email, password)
      setAuthToken(data.token)
      setUser(data.user)
      return null
    } catch (err: any) {
      return err.message
    }
  }

  const signUp = async (email: string, password: string, name: string): Promise<string | null> => {
    try {
      const data = await authApi.signup(email, password, name)
      setAuthToken(data.token)
      setUser(data.user)
      return null
    } catch (err: any) {
      return err.message
    }
  }

  const signOut = async () => {
    setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
