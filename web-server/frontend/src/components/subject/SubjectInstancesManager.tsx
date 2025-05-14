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
import { RefreshCw } from 'lucide-react'
import { useSubjectVMs } from '@/hooks/useSubjectVMs'
import { VMStartButton } from '@/components/vm/VMStartButton'
import { VMStopButton } from '@/components/vm/VMStopButton'
import { VMDeleteButton } from '@/components/vm/VMDeleteButton'
import { useAuth } from '@/context/AuthContext'

interface SubjectInstancesManagerProps {
  subjectId: string
}

export const SubjectInstancesManager: React.FC<
  SubjectInstancesManagerProps
> = ({ subjectId }) => {
  const {
    vms: initialInstances,
    loading: vmsLoading,
    refresh,
  } = useSubjectVMs(subjectId)
  const [instances, setInstances] = useState(initialInstances)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user } = useAuth()
  const isProfessorOrAdmin =
    user?.role === 'professor' || user?.role === 'admin'
  const runningVMsCount = instances.filter(
    (vm) => vm.status.toLowerCase() === 'running'
  ).length

  // Sync local state with hook when refreshed
  React.useEffect(() => {
    setInstances(initialInstances)
  }, [initialInstances])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  // Actualizadores locales
  const handleDelete = (instanceId: string) => {
    setInstances((prev) => prev.filter((vm) => vm.instanceId !== instanceId))
  }
  const handleStart = (instanceId: string) => {
    setInstances((prev) =>
      prev.map((vm) =>
        vm.instanceId === instanceId ? { ...vm, status: 'running' } : vm
      )
    )
  }
  const handleStop = (instanceId: string) => {
    setInstances((prev) =>
      prev.map((vm) =>
        vm.instanceId === instanceId ? { ...vm, status: 'shut off' } : vm
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subject Instances</h2>
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
      <div className="overflow-x-auto rounded-md border">
        {vmsLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading instances...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Template Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((vm) => {
                const canStart =
                  isProfessorOrAdmin ||
                  runningVMsCount === 0 ||
                  vm.status.toLowerCase() === 'running'
                return (
                  <TableRow key={vm.instanceId}>
                    <TableCell>
                      <span
                        className={`font-bold ${getStatusColor(vm.status)}`}
                      >
                        {getStatusDisplay(vm.status)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {vm.userMail || '-'}
                    </TableCell>
                    <TableCell>
                      {vm.createdAt
                        ? new Date(vm.createdAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">vCPUs:</span>
                          <span>{vm.template_vcpu_count || 'XX'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">RAM:</span>
                          <span>
                            {vm.template_vram_mb
                              ? `${vm.template_vram_mb / 1024} GB`
                              : 'XX'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Disk:</span>
                          <span>
                            {vm.template_size_mb
                              ? `${vm.template_size_mb / 1024} GB`
                              : 'XX'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {vm.templateDescription ||
                        vm.template_description ||
                        'No description available'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {vm.status.toLowerCase() === 'shut off' && canStart && (
                          <VMStartButton
                            instanceId={vm.instanceId}
                            onSuccess={() => handleStart(vm.instanceId)}
                          />
                        )}
                        {vm.status.toLowerCase() === 'running' && (
                          <VMStopButton
                            instanceId={vm.instanceId}
                            onSuccess={() => handleStop(vm.instanceId)}
                          />
                        )}
                        {vm.status.toLowerCase() === 'shut off' && (
                          <VMDeleteButton
                            instanceId={vm.instanceId}
                            onSuccess={() => handleDelete(vm.instanceId)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
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

function getStatusDisplay(status: string) {
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
