import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Subject } from '@/types/subject'

export const useSubject = (id: string) => {
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubject = async () => {
      console.log('useSubject: Fetching subject with id:', id)
      try {
        const response = await fetch(`http://localhost:8080/subjects/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(
            'useSubject: Failed to fetch subject details, status:',
            response.status
          )
          throw new Error('Failed to fetch subject details')
        }

        const subjectData: Subject = await response.json()

        setSubject(subjectData)
      } catch (error) {
        console.error('useSubject: Error fetching subject details:', error)
        toast({
          title: 'Error',
          description: 'Failed to load subject details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSubject()
    } else {
      console.warn('useSubject: No id provided')
      setLoading(false)
    }
  }, [id, toast])

  return { subject, loading }
}
