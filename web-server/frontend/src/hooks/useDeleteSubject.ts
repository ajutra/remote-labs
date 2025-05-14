import { useState } from 'react'
import { getEnv } from '@/utils/Env'

export const useDeleteSubject = () => {
  const [isLoading, setIsLoading] = useState(false)

  const deleteSubject = async (subjectId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        getEnv().API_DELETE_SUBJECT.replace('{subjectId}', subjectId),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        }
      )
      if (!response.ok) {
        throw new Error('Failed to delete subject')
      }
    } catch (error) {
      console.error('Error deleting subject:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteSubject, isLoading }
}
