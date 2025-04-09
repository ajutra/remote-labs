import React from 'react'
import { Loader2 } from 'lucide-react'
import { useVMs } from '@/hooks/useVMs'
import { VMsTable } from '@/components/vm/VMsTable'

const MyLabs: React.FC = () => {
  const { vms, loading } = useVMs()

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Labs</h1>
        <p className="text-muted-foreground">
          View and manage your virtual machines
        </p>
      </div>

      {vms.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            You don't have any virtual machines yet.
          </p>
        </div>
      ) : (
        <VMsTable vms={vms} />
      )}
    </div>
  )
}

export default MyLabs
