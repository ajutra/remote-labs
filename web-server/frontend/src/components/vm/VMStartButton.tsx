import { Button } from '@/components/ui/button'
import { useVMActions } from '@/hooks/useVMActions'
import { Play, Loader2 } from 'lucide-react'
import { useLoading } from '@/context/LoadingContext'
import { useState } from 'react'

interface VMStartButtonProps {
  instanceId: string
  onSuccess?: () => void
}

export const VMStartButton = ({
  instanceId,
  onSuccess,
}: VMStartButtonProps) => {
  const { startVM } = useVMActions()
  const { isLoading: globalLoading, setLoading } = useLoading()
  const [localLoading, setLocalLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    setLocalLoading(true)
    try {
      await startVM(instanceId)
      if (onSuccess) onSuccess()
    } finally {
      setLoading(false)
      setLocalLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
      onClick={handleStart}
      disabled={globalLoading}
    >
      {localLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      Start
    </Button>
  )
}
