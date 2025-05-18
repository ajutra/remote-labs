import { useState, useEffect } from 'react'
import { getEnv } from '@/utils/Env'

export interface User {
  id: string
  name: string
  mail: string
  role: string
}

export interface UserInstance {
  instanceId: string
  status: string
  subjectName: string
  createdAt: string
  template_vcpu_count: number
  template_vram_mb: number
  template_size_mb: number
  templateDescription: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = getEnv().API_BASE_URL
      const response = await fetch(`${apiUrl}/users`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return { users, loading, error, refresh: fetchUsers }
} 