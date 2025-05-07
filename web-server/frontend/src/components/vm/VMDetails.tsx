import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Square, Trash2, RefreshCw } from 'lucide-react'
import { VMListItem } from '@/types/vm'

interface VMDetailsProps {
  vm: VMListItem
  onRefresh: () => Promise<void>
  onStart: () => Promise<void>
  onStop: () => Promise<void>
  onDelete: () => Promise<void>
  isActionLoading: boolean
}

export const VMDetails: React.FC<VMDetailsProps> = ({
  vm,
  onRefresh,
  onStart,
  onStop,
  onDelete,
  isActionLoading,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-500'
      case 'stopped':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">{vm.subjectName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Created at: {vm.createdAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isActionLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Status Section */}
          <div className="flex items-center space-x-2">
            <div
              className={`h-3 w-3 rounded-full ${getStatusColor(vm.status)}`}
            />
            <span className="font-medium capitalize">{vm.status}</span>
          </div>

          {/* Resources Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Resources</h3>
              <div className="rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">vCPUs</span>
                    <span className="font-medium">
                      {vm.template_vcpu_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">RAM</span>
                    <span className="font-medium">
                      {vm.template_vram_mb} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Disk</span>
                    <span className="font-medium">
                      {vm.template_size_mb} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Instance Details</h3>
              <div className="rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Instance ID
                    </span>
                    <span className="font-medium">{vm.instanceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Template ID
                    </span>
                    <span className="font-medium">{vm.templateId}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">User Info</h3>
              <div className="rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      User ID
                    </span>
                    <span className="font-medium">{vm.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{vm.userMail}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onStart}
              disabled={isActionLoading || vm.status === 'running'}
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              disabled={isActionLoading || vm.status === 'stopped'}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isActionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
