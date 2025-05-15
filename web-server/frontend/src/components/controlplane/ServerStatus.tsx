import React from 'react'

const ServerStatus: React.FC = () => {
  // Mock data
  const cpu = 32
  const ram = 7.8
  const ramTotal = 16
  const disk = 120
  const diskTotal = 256
  const load = 0.32

  return (
    <div className="flex h-full flex-col justify-center rounded bg-card p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold text-primary">
        Server Status
      </h2>
      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-1 text-sm text-muted-foreground">CPU Usage</div>
            <div className="text-3xl font-bold text-primary">{cpu}%</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-muted-foreground">RAM</div>
            <div className="text-3xl font-bold text-primary">
              {ram} / {ramTotal} GB
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm text-muted-foreground">Disk</div>
            <div className="text-3xl font-bold text-primary">
              {disk} / {diskTotal} GB
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          {/* Simple circular chart mock */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#6366f1"
              strokeWidth="12"
              fill="none"
              strokeDasharray={314}
              strokeDashoffset={314 - 314 * load}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s' }}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dy=".3em"
              className="fill-primary text-2xl font-bold"
            >
              {Math.round(load * 100)}%
            </text>
          </svg>
          <div className="mt-2 text-sm text-muted-foreground">Server Load</div>
        </div>
      </div>
    </div>
  )
}

export default ServerStatus
