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
import { RefreshCw, Search, Trash } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { useUserInstances } from '@/hooks/useUserInstances'
import { VMStartButton } from '@/components/vm/VMStartButton'
import { VMStopButton } from '@/components/vm/VMStopButton'
import { VMDeleteButton } from '@/components/vm/VMDeleteButton'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-green-600'
    case 'idle':
      return 'text-blue-600'
    case 'paused':
      return 'text-yellow-600'
    case 'in shutdown':
      return 'text-orange-600'
    case 'crashed':
      return 'text-red-600'
    case 'shut off':
      return 'text-gray-600'
    case 'pmsuspended':
      return 'text-purple-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusDisplay = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'RUNNING'
    case 'idle':
      return 'IDLE'
    case 'paused':
      return 'PAUSED'
    case 'in shutdown':
      return 'SHUTTING DOWN'
    case 'crashed':
      return 'CRASHED'
    case 'shut off':
      return 'SHUT OFF'
    case 'pmsuspended':
      return 'SUSPENDED'
    default:
      return status.toUpperCase()
  }
}

const UserManager: React.FC = () => {
  const { users, loading: usersLoading, error: usersError, refresh: refreshUsers, deleteUser } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { instances = [], loading: instancesLoading, error: instancesError, refresh: refreshInstances } = useUserInstances(selectedUserId || '')
  const { user: currentUser } = useAuth()
  const isProfessorOrAdmin = currentUser?.role === 'professor' || currentUser?.role === 'admin'
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refreshUsers(), selectedUserId && refreshInstances()])
    setIsRefreshing(false)
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(selectedUserId === userId ? null : userId)
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleteLoading(userId)
    const result = await deleteUser(userId)
    setDeleteLoading(null)
    setUserToDelete(null)
    if (result.ok) {
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully.',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.mail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (usersLoading) {
    return <div>Loading users...</div>
  }

  if (usersError) {
    return <div>Error: {usersError}</div>
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users</h2>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedUserId === user.id ? 'bg-muted' : ''
                  }`}
                >
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.mail}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUserToDelete(user.id)
                      }}
                      disabled={deleteLoading === user.id || instances.length > 0 || user.id === currentUser?.id}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedUserId && (
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Instances</h2>
          </div>
          {instancesLoading ? (
            <div>Loading instances...</div>
          ) : instancesError ? (
            <div>Error: {instancesError}</div>
          ) : instances.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              This user has no instances.
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => {
                    const canStart =
                      isProfessorOrAdmin ||
                      instances.filter((i) => i.status.toLowerCase() === 'running').length === 0 ||
                      instance.status.toLowerCase() === 'running'

                    return (
                      <TableRow key={instance.instanceId}>
                        <TableCell className={getStatusColor(instance.status)}>
                          {getStatusDisplay(instance.status)}
                        </TableCell>
                        <TableCell>{instance.subjectName}</TableCell>
                        <TableCell>{new Date(instance.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">vCPUs:</span>
                              <span>{instance.template_vcpu_count || 'XX'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">RAM:</span>
                              <span>
                                {instance.template_vram_mb
                                  ? `${instance.template_vram_mb / 1024} GB`
                                  : 'XX'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Disk:</span>
                              <span>
                                {instance.template_size_mb
                                  ? `${instance.template_size_mb / 1024} GB`
                                  : 'XX'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {instance.status.toLowerCase() === 'shut off' && canStart && (
                              <VMStartButton
                                instanceId={instance.instanceId}
                                onSuccess={refreshInstances}
                              />
                            )}
                            {instance.status.toLowerCase() === 'running' && (
                              <VMStopButton
                                instanceId={instance.instanceId}
                                onSuccess={refreshInstances}
                              />
                            )}
                            {instance.status.toLowerCase() === 'shut off' && (
                              <VMDeleteButton
                                instanceId={instance.instanceId}
                                onSuccess={refreshInstances}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserManager
