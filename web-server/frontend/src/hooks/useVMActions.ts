import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export const useVMActions = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const startVM = async (instanceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8080/instances/start/${instanceId}`,
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
        `http://localhost:8080/instances/stop/${instanceId}`,
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
        `http://localhost:8080/instances/delete/${instanceId}`,
        {
          method: 'POST',
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
