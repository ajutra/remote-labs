import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useDeleteSubject } from '@/hooks/useDeleteSubject'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface DeleteSubjectButtonProps {
  subjectId: string
  onSuccess?: () => void
}

export const DeleteSubjectButton: React.FC<DeleteSubjectButtonProps> = ({
  subjectId,
  onSuccess,
}) => {
  const { deleteSubject, error, setError } = useDeleteSubject()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await deleteSubject(subjectId)
      if (onSuccess) {
        onSuccess()
      }
      setIsDialogOpen(false) // Close dialog after successful deletion
    } catch (error) {
      // El error ya se gestiona y expone en el hook
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsDialogOpen(false) // Close dialog on cancel
    setError(null)
  }

  return (
    <AlertDialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) setError(null)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Delete Subject'
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this subject?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="mb-2 rounded border border-red-300 bg-red-100 p-2 text-red-700">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
