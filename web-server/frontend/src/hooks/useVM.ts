import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VM } from '@/types/subject'

export const useVM = (subjectId: string) => {
  const [vm, setVm] = useState<VM | null>(null)
  const [requestingLab, setRequestingLab] = useState(false)
  const [vmActionLoading, setVmActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const requestLab = async () => {
    setRequestingLab(true)
    try {
      // TODO: Replace with actual API call
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock response
      setVm({
        id: '1',
        name: 'Math Lab VM',
        status: 'stopped',
        subjectId,
        ipAddress: '192.168.1.100',
        os: 'Ubuntu 22.04 LTS',
        cpu: '2 vCPUs',
        memory: '4 GB',
        disk: '20 GB',
        lastStarted: '2024-03-15 14:30:00',
        wireguardConfig: `[Interface]
PrivateKey = your_private_key
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = server_public_key
AllowedIPs = 10.0.0.0/24
Endpoint = vpn.example.com:51820
PersistentKeepalive = 25`,
      })

      toast({
        title: 'Success',
        description: 'Lab requested successfully',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to request lab',
        variant: 'destructive',
      })
    } finally {
      setRequestingLab(false)
    }
  }

  const handleVMAction = async (action: 'start' | 'stop' | 'pause') => {
    if (!vm) return

    setVmActionLoading(action)
    try {
      // TODO: Replace with actual API call
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock response
      setVm((prev) =>
        prev
          ? {
              ...prev,
              status:
                action === 'start'
                  ? 'running'
                  : action === 'stop'
                    ? 'stopped'
                    : 'paused',
            }
          : null
      )

      toast({
        title: 'Success',
        description: `VM ${action}ed successfully`,
      })
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${action} VM`,
        variant: 'destructive',
      })
    } finally {
      setVmActionLoading(null)
    }
  }

  return {
    vm,
    requestingLab,
    vmActionLoading,
    requestLab,
    handleVMAction,
  }
}
