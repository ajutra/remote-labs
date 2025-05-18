import { useState, useEffect } from 'react'
import { getEnv } from '@/utils/Env'
import { useAuth } from '@/context/AuthContext'

export interface Subject {
  id: string
  name: string
  code: string
  professorName: string
  professorMail: string
}

export function useAllSubjects() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllSubjects = async () => {
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      try {
        const apiUrl = getEnv().API_BASE_URL
        const response = await fetch(`${apiUrl}/subjects`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch subjects')
        }

        const data = await response.json()
        setSubjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAllSubjects()
  }, [user])

  return { subjects, loading, error }
} 