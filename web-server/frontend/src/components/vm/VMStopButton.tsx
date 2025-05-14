import { Button } from '@/components/ui/button'
import { useVMActions } from '@/hooks/useVMActions'
import { Square, Loader2 } from 'lucide-react'
import { useLoading } from '@/context/LoadingContext'
import { useState } from 'react'

interface VMStopButtonProps {
  instanceId: string
}

export const VMStopButton = ({ instanceId }: VMStopButtonProps) => {
  const { stopVM } = useVMActions()
  const { isLoading: globalLoading, setLoading } = useLoading()
  const [localLoading, setLocalLoading] = useState(false)

  const handleStop = async () => {
    setLoading(true)
    setLocalLoading(true)
    try {
      await stopVM(instanceId)
      window.location.reload()
    } finally {
      setLoading(false)
      setLocalLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
      onClick={handleStop}
      disabled={globalLoading}
    >
      {localLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Square className="mr-2 h-4 w-4" />
      )}
      Stop
    </Button>
  )
}
