import { Button } from '@/components/ui/button'
import { useVMActions } from '@/hooks/useVMActions'
import { Play } from 'lucide-react'

interface VMStartButtonProps {
  instanceId: string
  onSuccess?: () => void
}

export const VMStartButton = ({
  instanceId,
  onSuccess,
}: VMStartButtonProps) => {
  const { startVM, isLoading } = useVMActions()

  const handleStart = async () => {
    const success = await startVM(instanceId)
    if (success && onSuccess) {
      onSuccess()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
      onClick={handleStart}
      disabled={isLoading}
    >
      <Play className="mr-2 h-4 w-4" />
      Start
    </Button>
  )
}
