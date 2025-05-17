import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VMListItem } from '@/types/vm'
import { useAuth } from '@/context/AuthContext'
import { getEnv } from '@/utils/Env'

export const useSubjectVMs = (subjectId: string) => {
  const [vms, setVms] = useState<VMListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchVMs = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        getEnv().API_GET_INSTANCE_STATUS.replace('{userId}', user.id)
      )
      if (!response.ok) {
        throw new Error('Failed to fetch VMs')
      }
      const data = await response.json()
      console.log('Fetched VMs data for subject:', data) // Log the fetched data
      const subjectVMs = data
        .filter((vm: VMListItem) => vm.subjectId === subjectId)
        .map((vm: VMListItem) => ({
          ...vm,
          templateDescription: vm.template_description, // Map the field
        }))
      console.log('Mapped VMs for subject:', subjectVMs) // Log the mapped data
      setVms(subjectVMs)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load VMs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, subjectId, toast])

  useEffect(() => {
    fetchVMs()
  }, [fetchVMs])

  return { vms, loading, refresh: fetchVMs }
}
