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
import { RefreshCw, Play, Square, Trash2 } from 'lucide-react'
import { VMListItem } from '@/types/vm'

interface VMsTableProps {
  vms: VMListItem[]
  onRefresh: () => Promise<void>
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-green-600'
    case 'stopped':
      return 'text-yellow-600'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-gray-600'
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
                    {vm.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{vm.subjectName}</TableCell>
                <TableCell>{vm.createdAt}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">vCPUs:</span>
                      <span>{vm.template_vcpu_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">RAM:</span>
                      <span>{vm.template_vram_mb} MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Disk:</span>
                      <span>{vm.template_size_mb} MB</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement start action
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement stop action
                      }}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement delete action
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
