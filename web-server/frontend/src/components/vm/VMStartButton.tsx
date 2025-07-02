import { Button } from '@/components/ui/button'
import { useVMActions } from '@/hooks/useVMActions'
import { Play, Loader2, Clock, Mail, RefreshCw } from 'lucide-react'
import { useLoading } from '@/context/LoadingContext'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
        onClick={() => setShowConfirmDialog(true)}
        disabled={globalLoading}
      >
        {localLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        Start
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-yellow-600">Session Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600">Session Duration</p>
                <p className="text-sm text-muted-foreground">2 hours from start</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600">Email Notifications</p>
                <p className="text-sm text-muted-foreground">You'll receive an email with your session end time</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RefreshCw className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600">Session Renewal</p>
                <p className="text-sm text-muted-foreground">30 minutes before the end, you'll get an email with a link to extend your session for 2 more hours</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false)
                handleStart()
              }}
              className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
            >
              Start VM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
