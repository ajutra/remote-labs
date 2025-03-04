import { useState, useEffect } from 'react'
import { getEnv } from '@/utils/Env'
import { useAuth } from '@/context/AuthContext'
import { getUserIdFromCookie } from '@/utils/cookies'

interface Subject {
  id: string
  name: string
  code: string
  professorMail: string
}

const useSubjects = () => {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const userId = user?.id || getUserIdFromCookie()
        if (!userId) {
          throw new Error('User ID not found')
        }
        const apiUrl = getEnv().API_BASE_URL
        const fullUrl = `${apiUrl}/users/${userId}/subjects`
        console.log('Full URL:', fullUrl)
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setSubjects(data)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unknown error occurred')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [user])

  return { subjects, loading, error }
}

export default useSubjects
