import { Button } from '@/components/ui/button'
import { useVMActions } from '@/hooks/useVMActions'
import { Square } from 'lucide-react'

interface VMStopButtonProps {
  instanceId: string
  onSuccess?: () => void
}

export const VMStopButton = ({ instanceId, onSuccess }: VMStopButtonProps) => {
  const { stopVM, isLoading } = useVMActions()

  const handleStop = async () => {
    const success = await stopVM(instanceId)
    if (success && onSuccess) {
      onSuccess()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStop}
      disabled={isLoading}
    >
      <Square className="mr-2 h-4 w-4" />
      Stop
    </Button>
  )
}
