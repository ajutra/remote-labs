import { Button } from '@/components/ui/button'
import { useVMActions } from '@/hooks/useVMActions'
import { Trash, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useLoading } from '@/context/LoadingContext'
import { useState } from 'react'

interface VMDeleteButtonProps {
  instanceId: string
}

export const VMDeleteButton = ({ instanceId }: VMDeleteButtonProps) => {
  const { deleteVM } = useVMActions()
  const { isLoading: globalLoading, setLoading } = useLoading()
  const [localLoading, setLocalLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    setLocalLoading(true)
    try {
      await deleteVM(instanceId)
      window.location.reload()
    } finally {
      setLoading(false)
      setLocalLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
          disabled={globalLoading}
        >
          {localLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash className="mr-2 h-4 w-4" />
          )}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this virtual machine? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
