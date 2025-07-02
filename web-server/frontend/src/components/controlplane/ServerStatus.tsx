import React from 'react'
import { useServerStatus } from '../../hooks/useServerStatus'
import { AlertCircle, Cpu } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Area, AreaChart, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts'

const ServerStatus: React.FC = () => {
  const { serverStatus, loading, error, history } = useServerStatus()

  const cleanServerIp = (ip: string) => {
    return ip.replace(/^https?:\/\//, '').replace(/:\d+$/, '')
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col justify-center rounded bg-card p-4 shadow-md">
        <h2 className="mb-4 text-center text-xl font-bold text-primary">
          Server Status
        </h2>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading server status...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col justify-center rounded bg-card p-4 shadow-md">
        <h2 className="mb-4 text-center text-xl font-bold text-primary">
          Server Status
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <p className="text-base font-medium text-destructive">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (serverStatus.length === 0) {
    return (
      <div className="flex h-full flex-col justify-center rounded bg-card p-4 shadow-md">
        <h2 className="mb-4 text-center text-xl font-bold text-primary">
          Server Status
        </h2>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">No servers available</div>
        </div>
      </div>
    )
  }

  // Calculate grid columns based on number of servers
  const gridCols = serverStatus.length <= 2 ? 'grid-cols-1' : 
                  serverStatus.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Usage
              </span>
              <span className="font-bold text-muted-foreground">
                {payload[0].value?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex h-full flex-col rounded bg-card p-4 shadow-md">
      <h2 className="mb-4 text-center text-xl font-bold text-primary">
        Server Status
      </h2>
      <div className={`grid ${gridCols} gap-4`}>
        {serverStatus.map((server) => {
          const serverHistory = history[server.serverIp]
          const cpuData = serverHistory.cpu.map((value, index) => ({ time: index, value }))
          const ramData = serverHistory.ram.map((value, index) => ({ time: index, value }))
          const diskData = serverHistory.disk.map((value, index) => ({ time: index, value }))

          return (
            <Card key={server.serverIp} className="p-3">
              <h3 className="mb-2 text-base font-semibold text-primary">
                Server: {cleanServerIp(server.serverIp)}
              </h3>
              
              {/* CPU Usage Chart */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">CPU Usage</div>
                  <div className="text-sm font-bold text-primary">
                    {(server.cpuLoad * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="h-[60px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuData}>
                      <defs>
                        <linearGradient id={`cpuGradient-${server.serverIp}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill={`url(#cpuGradient-${server.serverIp})`}
                        strokeWidth={1.5}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RAM Usage Chart */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">RAM Usage</div>
                  <div className="text-sm font-bold text-primary">
                    {((server.totalMemoryMB - server.freeMemoryMB) / 1024).toFixed(1)} /{' '}
                    {(server.totalMemoryMB / 1024).toFixed(1)} GB
                  </div>
                </div>
                <div className="h-[60px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ramData}>
                      <defs>
                        <linearGradient id={`ramGradient-${server.serverIp}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill={`url(#ramGradient-${server.serverIp})`}
                        strokeWidth={1.5}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Disk Usage Chart */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Disk Usage</div>
                  <div className="text-sm font-bold text-primary">
                    {((server.totalDiskMB - server.freeDiskMB) / 1024).toFixed(1)} /{' '}
                    {(server.totalDiskMB / 1024).toFixed(1)} GB
                  </div>
                </div>
                <div className="h-[60px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={diskData}>
                      <defs>
                        <linearGradient id={`diskGradient-${server.serverIp}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill={`url(#diskGradient-${server.serverIp})`}
                        strokeWidth={1.5}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Running Instances */}
              <div className="mt-2 border-t pt-2">
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Cpu className="h-3 w-3" />
                  Running Instances ({server.runningInstances.length})
                </div>
                {server.runningInstances.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {server.runningInstances.map((instance) => (
                      <span
                        key={instance}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {instance}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No instances running
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default ServerStatus
