import { useState } from 'react'
import { getEnv } from '@/utils/Env'

export const useDeleteSubject = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteSubject = async (subjectId: string) => {
    setIsLoading(true)
    setError(null)
    const url = getEnv().API_DELETE_SUBJECT.replace('{id}', subjectId)
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })
      if (!response.ok) {
        let errorBody = ''
        try {
          errorBody = await response.text()
        } catch {
          errorBody = '[Error reading body]'
        }
        let message = 'Failed to delete subject'
        try {
          const parsed = JSON.parse(errorBody)
          if (parsed && parsed.error) message = parsed.error
        } catch {
          // ignore JSON parse error
        }
        setError(message)
        throw new Error(message)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to delete subject')
        throw error
      } else {
        setError('Failed to delete subject')
        throw new Error('Failed to delete subject')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteSubject, isLoading, error, setError }
}
