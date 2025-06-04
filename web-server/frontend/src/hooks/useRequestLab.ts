import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { getEnv } from '@/utils/Env'

export const useRequestLab = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const requestLab = async (subjectId: string, templateId: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to request a lab',
        variant: 'destructive',
      })
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${getEnv().API_CREATE_INSTANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subjectId,
          templateId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to request lab')
      }

      toast({
        title: 'Success',
        description: 'Lab requested successfully',
      })
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request lab',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    requestLab,
    isLoading,
  }
}
