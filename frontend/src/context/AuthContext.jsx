import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

// Odświeżaj token co 12h (token ważny 24h, więc mamy bufor)
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimer = useRef(null)

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current)
      refreshTimer.current = null
    }
  }

  const startRefreshTimer = useCallback(() => {
    clearRefreshTimer()
    refreshTimer.current = setInterval(async () => {
      try {
        const { data } = await api.post('/api/auth/refresh')
        localStorage.setItem('token', data.access_token)
      } catch {
        // Token wygasł — wyloguj
        localStorage.removeItem('token')
        setUser(null)
        clearRefreshTimer()
      }
    }, REFRESH_INTERVAL_MS)
  }, [])

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/api/users/me')
      setUser(data)
      startRefreshTimer()
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [startRefreshTimer])

  useEffect(() => {
    fetchUser()
    return () => clearRefreshTimer()
  }, [fetchUser])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
    await fetchUser()
  }

  const register = async (email, password, passwordConfirm, displayName) => {
    await api.post('/api/auth/register', {
      email,
      password,
      password_confirm: passwordConfirm,
      display_name: displayName,
    })
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    clearRefreshTimer()
  }

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/users/me')
      setUser(data)
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
