import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VMListItem } from '@/types/vm'
import { useAuth } from '@/context/AuthContext'
import { getEnv } from '@/utils/Env'

export const useVMs = () => {
  const [vms, setVms] = useState<VMListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchVMs = useCallback(async () => {
    if (!user?.id) {
      setVms([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${getEnv().API_GET_INSTANCE_STATUS.replace('{userId}', user.id)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch VMs')
      }
      const data = await response.json()
      console.log('Fetched VMs data:', data) // Log the fetched data
      const enrichedData = (data || []).map((vm: VMListItem) => ({
        ...vm,
        templateDescription:
          vm.template_description || 'No description provided',
      }))
      console.log('Enriched VMs data:', enrichedData) // Log the enriched data
      setVms(enrichedData)
    } catch (error) {
      console.error('Error fetching VMs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load VMs',
        variant: 'destructive',
      })
      setVms([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  useEffect(() => {
    fetchVMs()
  }, [fetchVMs])

  return { vms, loading, refresh: fetchVMs }
}
