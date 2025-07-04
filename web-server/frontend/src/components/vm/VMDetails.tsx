import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Monitor } from 'lucide-react'
import { VMListItem } from '@/types/vm'
import { VMStartButton } from './VMStartButton'
import { VMStopButton } from './VMStopButton'
import { VMDeleteButton } from './VMDeleteButton'
import { DefineTemplateButton } from './DefineTemplateButton'
import { WireguardConfigButton } from './WireguardConfigButton'

interface VMDetailsProps {
  vm: VMListItem
  isTeacherOrAdmin: boolean
}

export const VMDetails: React.FC<VMDetailsProps> = ({
  vm: initialVM,
  isTeacherOrAdmin,
}) => {
  const [vm, setVM] = React.useState(initialVM)

  const handleStart = () => setVM((prev) => ({ ...prev, status: 'running' }))
  const handleStop = () => setVM((prev) => ({ ...prev, status: 'shut off' }))
  const [deleted, setDeleted] = React.useState(false)
  const handleDelete = () => setDeleted(true)

  if (deleted) return null

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
          <Monitor className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Created at: {new Date(vm.createdAt).toLocaleDateString()}
          </p>
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
                      {vm.template_vram_mb / 1024} GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Disk</span>
                    <span className="font-medium">
                      {vm.template_size_mb / 1024} GB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Instance Details</h3>
              <div className="col-span-full rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Template Description
                    </span>
                    <span className="break-words font-medium">
                      {vm.templateDescription || 'No description available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      User Email
                    </span>
                    <span className="break-words font-medium">
                      {vm.userMail}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex justify-end space-x-2">
            {vm.status.toLowerCase() === 'shut off' && (
              <VMStartButton
                instanceId={vm.instanceId}
                onSuccess={handleStart}
              />
            )}
            {vm.status.toLowerCase() === 'running' && (
              <VMStopButton instanceId={vm.instanceId} onSuccess={handleStop} />
            )}
            <WireguardConfigButton instanceId={vm.instanceId} />
            {vm.status.toLowerCase() === 'shut off' && (
              <VMDeleteButton
                instanceId={vm.instanceId}
                onSuccess={handleDelete}
              />
            )}
          </div>
          {isTeacherOrAdmin && !vm.templateId && (
            <div className="mt-4 flex justify-end">
              <DefineTemplateButton
                vm={vm}
                isTeacherOrAdmin={isTeacherOrAdmin}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
