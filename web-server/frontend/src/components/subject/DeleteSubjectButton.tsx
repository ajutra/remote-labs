import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useDeleteSubject } from '@/hooks/useDeleteSubject'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  const { deleteSubject } = useDeleteSubject()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteSubject(subjectId)
      if (onSuccess) {
        onSuccess()
      }
      setIsDialogOpen(false) // Close dialog after successful deletion
    } catch (error) {
      console.error('Error deleting subject:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsDialogOpen(false) // Close dialog on cancel
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            Are you sure you want to delete this subject? This action cannot be
            undone. Deleting a subject will also remove all its associated
            instances and templates.
          </AlertDialogDescription>
        </AlertDialogHeader>
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
