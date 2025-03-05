import { useState, useEffect } from 'react'
import { getEnv } from '@/utils/Env'
import { useAuth } from '@/context/AuthContext'
import { getUserIdFromCookie } from '@/utils/cookies'

interface Subject {
  id: string
  name: string
  code: string
  professorName?: string
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
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const subjectsData: Subject[] = await response.json()

        const subjectsWithProfessorDetails = await Promise.all(
          subjectsData.map(async (subject) => {
            const professorResponse = await fetch(
              `${apiUrl}/users/${subject.professorMail}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
            if (professorResponse.ok) {
              const professorData = await professorResponse.json()
              return {
                ...subject,
                professorName: professorData.name,
                professorMail: professorData.mail,
              }
            } else {
              return subject
            }
          })
        )

        setSubjects(subjectsWithProfessorDetails)
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
