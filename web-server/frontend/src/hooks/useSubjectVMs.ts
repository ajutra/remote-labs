import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VMListItem } from '@/types/vm'
import { useAuth } from '@/context/AuthContext'
import { getEnv } from '@/utils/Env'

interface UseSubjectVMsOptions {
  filterByUser?: boolean;
}

export const useSubjectVMs = (subjectId: string, options: UseSubjectVMsOptions = {}) => {
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
      // Si filterByUser es true, usamos el endpoint específico del usuario
      const endpoint = options.filterByUser 
        ? getEnv().API_GET_INSTANCE_STATUS.replace('{userId}', user.id)
        : getEnv().API_BASE_URL + '/instances/status'

      const response = await fetch(endpoint)
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
        title: 'Information',
        description: 'No VMs found',
        variant: 'default',
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, subjectId, toast, options.filterByUser])

  useEffect(() => {
    fetchVMs()
  }, [fetchVMs])

  return { vms, loading, refresh: fetchVMs }
}
