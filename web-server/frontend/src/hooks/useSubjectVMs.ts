import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VMListItem } from '@/types/vm'
import { useAuth } from '@/context/AuthContext'

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
        `http://localhost:8080/instances/status/${user.id}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch VMs')
      }
      const data = await response.json()
      const subjectVMs = data.filter(
        (vm: VMListItem) => vm.subjectId === subjectId
      )
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
