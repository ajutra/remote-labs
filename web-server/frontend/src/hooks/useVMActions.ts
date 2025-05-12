import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getEnv } from '@/utils/Env'

export const useVMActions = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const startVM = async (instanceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        getEnv().API_START_INSTANCE.replace('{instanceId}', instanceId),
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to start VM')
      }

      toast({
        title: 'Success',
        description: 'VM started successfully',
      })
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start VM',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const stopVM = async (instanceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        getEnv().API_STOP_INSTANCE.replace('{instanceId}', instanceId),
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to stop VM')
      }

      toast({
        title: 'Success',
        description: 'VM stopped successfully',
      })
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop VM',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteVM = async (instanceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        getEnv().API_DELETE_INSTANCE.replace('{instanceId}', instanceId),
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete VM')
      }

      toast({
        title: 'Success',
        description: 'VM deleted successfully',
      })
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete VM',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    startVM,
    stopVM,
    deleteVM,
    isLoading,
  }
}
