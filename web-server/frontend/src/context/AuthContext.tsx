import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { getEnv } from '@/utils/Env'
import { useNavigate } from 'react-router-dom'
import { AppRoutes } from '@/enums/AppRoutes'

interface AuthContextType {
  isLoggedIn: boolean
  userId: string | null
  isLoading: boolean
  login: (mail: string, password: string) => Promise<{ error?: string }>
  register: (
    name: string,
    mail: string,
    password: string
  ) => Promise<{ error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedUserId = Cookies.get('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      setIsLoggedIn(true)
    }
  }, [])

  const handleSuccessfulAuth = (userId: string) => {
    setUserId(userId)
    setIsLoggedIn(true)
    Cookies.set('userId', userId, { expires: 7, sameSite: 'Lax' }) // Set cookie to expire in 7 days
  }

  const authenticate = async (url: string, body: object) => {
    setIsLoading(true)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    setIsLoading(false)

    if (response.ok) {
      const data = await response.json()
      handleSuccessfulAuth(data.id)
      navigate(AppRoutes.HOME)
      return {}
    } else {
      const errorText = await response.text()
      return { error: errorText }
    }
  }

  const login = (mail: string, password: string) => {
    return authenticate(`${getEnv().API_VALIDATE_USER}`, { mail, password })
  }

  const register = async (name: string, mail: string, password: string) => {
    setIsLoading(true)
    const response = await fetch(`${getEnv().API_CREATE_USER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, mail, password }),
    })

    setIsLoading(false)

    if (response.ok) {
      return {}
    } else {
      const errorText = await response.text()
      return { error: errorText }
    }
  }

  const logout = () => {
    setUserId(null)
    setIsLoggedIn(false)
    Cookies.remove('userId')
    navigate(AppRoutes.LOGIN)
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userId, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
