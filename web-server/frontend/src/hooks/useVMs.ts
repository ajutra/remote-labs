import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VMListItem } from '@/types/vm'

export const useVMs = () => {
  const [vms, setVms] = useState<VMListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchVMs = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data
        setVms([
          {
            id: '1',
            name: 'Math Lab VM',
            status: 'running',
            subject: {
              id: '1',
              name: 'Mathematics',
              code: '101',
              professorName: 'John Doe',
              professorMail: 'john@tecnocampus.cat',
            },
            ipAddress: '192.168.1.100',
            os: 'Ubuntu 22.04 LTS',
            lastStarted: '2024-03-15 14:30:00',
          },
          {
            id: '2',
            name: 'Physics Lab VM',
            status: 'stopped',
            subject: {
              id: '2',
              name: 'Physics',
              code: '102',
              professorName: 'Jane Smith',
              professorMail: 'jane@tecnocampus.cat',
            },
            ipAddress: '192.168.1.101',
            os: 'Ubuntu 22.04 LTS',
            lastStarted: '2024-03-14 10:15:00',
          },
        ])
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load VMs',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVMs()
  }, [toast])

  return { vms, loading }
}
