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

export const VMsTable: React.FC<VMsTableProps> = ({ vms, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vms.map((vm) => (
              <TableRow key={vm.instanceId}>
                <TableCell>
                  <span className={`font-medium ${getStatusColor(vm.status)}`}>
                    {getStatusDisplay(vm.status)}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{vm.subjectName}</TableCell>
                <TableCell>
                  {new Date(vm.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">vCPUs:</span>
                      <span>{vm.template_vcpu_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">RAM:</span>
                      <span>{vm.template_vram_mb / 1024} GB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Disk:</span>
                      <span>{vm.template_size_mb / 1024} GB</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {['shut off', 'crashed'].includes(
                      vm.status.toLowerCase()
                    ) && (
                      <VMStartButton
                        instanceId={vm.instanceId}
                        onSuccess={onRefresh}
                      />
                    )}
                    {['running', 'idle'].includes(vm.status.toLowerCase()) && (
                      <VMStopButton
                        instanceId={vm.instanceId}
                        onSuccess={onRefresh}
                      />
                    )}
                    <VMDeleteButton
                      instanceId={vm.instanceId}
                      onSuccess={onRefresh}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
