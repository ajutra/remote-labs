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
import { VMListItem } from '@/types/vm'
import { VMStartButton } from './VMStartButton'
import { VMStopButton } from './VMStopButton'
import { VMDeleteButton } from './VMDeleteButton'
import { WireguardConfigButton } from './WireguardConfigButton'
import { useAuth } from '@/context/AuthContext'

interface VMsTableProps {
  vms: VMListItem[]
  onRefresh: () => Promise<void>
}

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

export const VMsTable: React.FC<VMsTableProps> = ({
  vms: initialVMs,
  onRefresh,
}) => {
  const [vms, setVMs] = useState(initialVMs)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user } = useAuth()
  const isProfessorOrAdmin =
    user?.role === 'professor' || user?.role === 'admin'
  const runningVMsCount = vms.filter(
    (vm) => vm.status.toLowerCase() === 'running'
  ).length

  // Sync local state with prop when refreshed
  React.useEffect(() => {
    setVMs(initialVMs)
  }, [initialVMs])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  // Actualizadores locales
  const handleDelete = (instanceId: string) => {
    setVMs((prev) => prev.filter((vm) => vm.instanceId !== instanceId))
  }
  const handleStart = (instanceId: string) => {
    setVMs((prev) =>
      prev.map((vm) =>
        vm.instanceId === instanceId ? { ...vm, status: 'running' } : vm
      )
    )
  }
  const handleStop = (instanceId: string) => {
    setVMs((prev) =>
      prev.map((vm) =>
        vm.instanceId === instanceId ? { ...vm, status: 'shut off' } : vm
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Virtual Machines</h2>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead>Template Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vms.map((vm) => {
              const canStart =
                isProfessorOrAdmin ||
                runningVMsCount === 0 ||
                vm.status.toLowerCase() === 'running'
              return (
                <TableRow key={vm.instanceId}>
                  <TableCell>
                    <span className={`font-bold ${getStatusColor(vm.status)}`}>
                      {getStatusDisplay(vm.status)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {vm.subjectName}
                  </TableCell>
                  <TableCell>
                    {new Date(vm.createdAt).toLocaleDateString()}
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
                    {vm.templateDescription || 'No description available'}
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
                      <WireguardConfigButton instanceId={vm.instanceId} />
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
      </div>
    </div>
  )
}
