import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('hiresense_token')

    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data)
      })
      .catch(() => {
        localStorage.removeItem('hiresense_token')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  async function login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    })

    const data = response.data

    localStorage.setItem(
      'hiresense_token',
      data.access_token,
    )

    setUser({
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
    })

    return data
  }

  function logout() {
    localStorage.removeItem('hiresense_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}