import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { getEnv } from '@/utils/Env'
import { useNavigate } from 'react-router-dom'
import { AppRoutes } from '@/enums/AppRoutes'
import { getUserIdFromCookie } from '@/utils/cookies'

interface User {
  id: string
  name: string
  mail: string
  role: string
  publicSshKeys: string[]
}

interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  isLoading: boolean
  login: (mail: string, password: string) => Promise<{ error?: string }>
  register: (
    name: string,
    mail: string,
    password: string
  ) => Promise<{ error?: string }>
  logout: () => void
  fetchUserDetails: (userId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUserId = getUserIdFromCookie()
    if (storedUserId) {
      // Obtener los detalles del usuario desde el backend
      fetchUserDetails(storedUserId)
        .catch(() => {
          // Si hay error al cargar los detalles, limpiamos el estado
          setUser(null)
          setIsLoggedIn(false)
          Cookies.remove('userId')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUserDetails = async (userId: string) => {
    const response = await fetch(`${getEnv().API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const userData = await response.json()
      setUser({
        id: userData.id,
        name: userData.name,
        mail: userData.mail,
        role: userData.role,
        publicSshKeys: userData.publicSshKeys || [],
      })
      setIsLoggedIn(true)
    } else {
      throw new Error('Failed to fetch user details')
    }
  }

  const handleSuccessfulAuth = async (userId: string) => {
    Cookies.set('userId', userId, { expires: 7, sameSite: 'Lax' }) // Set cookie to expire in 7 days
    await fetchUserDetails(userId)
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
      await handleSuccessfulAuth(data.id)
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
    setUser(null)
    setIsLoggedIn(false)
    Cookies.remove('userId')
    navigate(AppRoutes.LOGIN)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        isLoading,
        login,
        register,
        logout,
        fetchUserDetails,
      }}
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
