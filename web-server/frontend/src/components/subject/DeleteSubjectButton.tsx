import { useState } from 'react'
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
import { useNavigate } from 'react-router-dom'

interface DeleteSubjectButtonProps {
  subjectId: string
  onSuccess?: () => void
}

export function DeleteSubjectButton({
  subjectId,
  onSuccess,
}: DeleteSubjectButtonProps) {
  const { deleteSubject, error, setError } = useDeleteSubject()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletionSuccess, setDeletionSuccess] = useState(false)
  const navigate = useNavigate()

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await deleteSubject(subjectId)
      setDeletionSuccess(true)
      setTimeout(() => {
        navigate('/subjects', { replace: true })
      }, 1200)
      if (onSuccess) {
        onSuccess()
      }
    } catch {
      // error handled in hook
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setError(null)
    setDeletionSuccess(false)
  }

  return (
    <AlertDialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setError(null)
          setDeletionSuccess(false)
        }
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
        {deletionSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-red-600" />
            <div className="text-lg font-semibold text-red-700">
              Deleting subject...
            </div>
          </div>
        ) : (
          <>
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
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
