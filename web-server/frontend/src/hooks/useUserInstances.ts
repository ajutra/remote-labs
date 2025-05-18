import { useState, useEffect } from 'react'
import { getEnv } from '@/utils/Env'
import { UserInstance } from './useUsers'

export function useUserInstances(userId: string) {
  const [instances, setInstances] = useState<UserInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstances = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = getEnv().API_BASE_URL
      const response = await fetch(`${apiUrl}/instances/status/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user instances')
      }
      const data = await response.json()
      setInstances(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchInstances()
    }
  }, [userId])

  return { instances, loading, error, refresh: fetchInstances }
} 