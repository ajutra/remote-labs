import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Subject } from '@/types/subject'

export const useSubject = (id: string) => {
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data
        setSubject({
          id,
          name: 'Mathematics',
          code: '101',
          professorName: 'John Doe',
          professorMail: 'john@tecnocampus.cat',
        })
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load subject details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubject()
  }, [id, toast])

  return { subject, loading }
}
