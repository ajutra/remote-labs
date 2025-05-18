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
import { RefreshCw, Search } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { useUserInstances } from '@/hooks/useUserInstances'
import { VMStartButton } from '@/components/vm/VMStartButton'
import { VMStopButton } from '@/components/vm/VMStopButton'
import { VMDeleteButton } from '@/components/vm/VMDeleteButton'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-green-500'
    case 'stopped':
      return 'text-red-500'
    case 'creating':
      return 'text-yellow-500'
    default:
      return 'text-gray-500'
  }
}

const getStatusDisplay = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'Running'
    case 'stopped':
      return 'Stopped'
    case 'creating':
      return 'Creating'
    default:
      return status
  }
}

const UserManager: React.FC = () => {
  const { users, loading: usersLoading, error: usersError, refresh: refreshUsers } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { instances, loading: instancesLoading, error: instancesError, refresh: refreshInstances } = useUserInstances(selectedUserId || '')
  const { user: currentUser } = useAuth()
  const isProfessorOrAdmin = currentUser?.role === 'professor' || currentUser?.role === 'admin'
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refreshUsers(), selectedUserId && refreshInstances()])
    setIsRefreshing(false)
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(selectedUserId === userId ? null : userId)
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedUserId && (
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Instances</h2>
          </div>
          {instancesLoading ? (
            <div>Loading instances...</div>
          ) : instancesError ? (
            <div>Error: {instancesError}</div>
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
                          {instance.template_vcpu_count} vCPU, {instance.template_vram_mb}MB RAM,{' '}
                          {instance.template_size_mb}MB
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {instance.status.toLowerCase() === 'stopped' && canStart && (
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
                            {instance.status.toLowerCase() === 'stopped' && (
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
