import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VM } from '@/types/subject'

interface VMInfoProps {
  vm: VM
}

export const VMInfo = ({ vm }: VMInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Virtual Machine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium">Status</p>
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    vm.status === 'running'
                      ? 'bg-green-500'
                      : vm.status === 'stopped'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                  }`}
                />
                <span className="capitalize">{vm.status}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Name</p>
              <p className="text-muted-foreground">{vm.name}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">IP Address</p>
              <p className="text-muted-foreground">{vm.ipAddress}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Operating System</p>
              <p className="text-muted-foreground">{vm.os}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Resources</p>
              <div className="text-muted-foreground">
                <p>CPU: {vm.cpu}</p>
                <p>Memory: {vm.memory}</p>
                <p>Disk: {vm.disk}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Last Started</p>
              <p className="text-muted-foreground">{vm.lastStarted}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
