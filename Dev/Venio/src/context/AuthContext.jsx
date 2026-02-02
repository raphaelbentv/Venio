import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      const data = await apiFetch('/api/auth/me')
      setUser(data.user)
      return data.user
    } catch (err) {
      setUser(null)
      setToken(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = getToken()
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    const currentUser = await loadUser()
    return { token: data.token, user: currentUser }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
