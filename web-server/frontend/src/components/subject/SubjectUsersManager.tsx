import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useSubjectUsers } from '@/hooks/useSubjectUsers'
import { useSubjectVMs } from '@/hooks/useSubjectVMs'
import { Trash, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SubjectUsersManagerProps {
  subjectId: string
}

export const SubjectUsersManager: React.FC<SubjectUsersManagerProps> = ({
  subjectId,
}) => {
  const { users, loading, error, addUser, removeUser } =
    useSubjectUsers(subjectId)
  const { vms } = useSubjectVMs(subjectId)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [localUsers, setLocalUsers] = useState(users)
  const [showAdd, setShowAdd] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  React.useEffect(() => {
    setLocalUsers(users)
  }, [users])

  // Devuelve true si el usuario tiene alguna instancia asociada a la asignatura
  const hasInstances = (userMail: string) =>
    vms.some((vm) => vm.userMail === userMail)

  const handleRemove = async (userMail: string) => {
    setRemoveLoading(userMail)
    setRemoveError(null)
    const result = await removeUser(userMail)
    setRemoveLoading(null)
    if (result.ok) {
      toast({
        title: 'User removed',
        description: 'User removed from subject.',
      })
    } else {
      setRemoveError(result.error || 'Unknown error')
      toast({
        title: 'Error',
        description: result.error || 'Failed to remove user',
        variant: 'destructive',
      })
    }
  }

  const handleAddUser = async () => {
    setAddLoading(true)
    setAddError(null)
    const result = await addUser(addEmail)
    setAddLoading(false)
    if (result.ok) {
      setAddEmail('')
      setShowAdd(false)
      toast({
        title: 'User added',
        description: `User ${addEmail} enrolled successfully.`,
      })
    } else {
      setAddError(result.error || 'Unknown error')
      toast({
        title: 'Error',
        description: result.error || 'Failed to add user',
        variant: 'destructive',
      })
    }
  }

  // Separa el usuario actual del resto
  const current = localUsers.find(
    (u: (typeof users)[0]) => u.id === currentUser?.id
  )
  const others = localUsers.filter(
    (u: (typeof users)[0]) => u.id !== currentUser?.id
  )

  return (
    <div className="space-y-4">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
        Users
        <Button
          variant="outline"
          size="icon"
          className="ml-2 rounded-full border-yellow-400 text-yellow-600 shadow-sm hover:bg-yellow-100 hover:text-yellow-800 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
          onClick={() => setShowAdd((v) => !v)}
          aria-label="Add user"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </h2>
      {showAdd && (
        <form
          className="mb-2 flex flex-col items-stretch gap-2 rounded-none border-0 bg-transparent p-0 shadow-none md:flex-row md:items-center"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddUser()
          }}
        >
          <Input
            type="email"
            className={cn(
              'flex-1',
              'border-yellow-400 dark:border-yellow-500',
              'focus-visible:ring-yellow-400 dark:focus-visible:ring-yellow-500',
              'text-base',
              'bg-background',
              'shadow-sm'
            )}
            placeholder="Enter user email to add"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            required
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            className="h-10 bg-yellow-400 px-4 text-yellow-900 hover:bg-yellow-300 dark:bg-yellow-500 dark:text-yellow-900 dark:hover:bg-yellow-400"
            disabled={addLoading || !addEmail}
          >
            {addLoading ? 'Adding...' : 'Add'}
          </Button>
          {addError && (
            <span className="ml-2 text-xs text-red-600">{addError}</span>
          )}
        </form>
      )}
      {current && (
        <div className="mb-2 flex items-center gap-4 rounded border bg-muted p-2 text-muted-foreground">
          <span className="font-medium">You:</span>
          <span>
            {current.name} ({current.mail})
          </span>
          <span className="ml-2 rounded bg-gray-200 px-2 py-1 text-xs font-semibold">
            {current.role}
          </span>
          <span className="ml-4 text-xs text-gray-500">
            (You cannot remove yourself)
          </span>
        </div>
      )}
      {loading && <div>Loading users...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {others.map((user: (typeof users)[0]) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.mail}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                    onClick={() => handleRemove(user.mail)}
                    disabled={
                      hasInstances(user.mail) || removeLoading === user.mail
                    }
                    title={
                      hasInstances(user.mail)
                        ? 'User has instances in this subject'
                        : 'Remove from subject'
                    }
                  >
                    {removeLoading === user.mail ? (
                      'Removing...'
                    ) : (
                      <>
                        <Trash className="mr-2 h-4 w-4" /> Remove
                      </>
                    )}
                  </Button>
                  {removeError && removeLoading === user.mail && (
                    <span className="ml-2 text-xs text-red-600">
                      {removeError}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
