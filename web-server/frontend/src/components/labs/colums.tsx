'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import '@/index.css'

export type Lab = {
  id: string
  subject: string
  machineName: string
  status: 'off' | 'on'
}

export const columns: ColumnDef<Lab>[] = [
  {
    accessorKey: 'subject',
    header: 'Subject',
  },
  {
    accessorKey: 'machineName',
    header: 'Machine Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status')
      return (
        <span className={`status-${status}`}>
          {status === 'on' ? 'On' : 'Off'}
        </span>
      )
    },
  },
  {
    id: 'action',
    header: 'Action',
    cell: ({ row }) => {
      const status = row.getValue('status')
      return (
        <Button
          className={`${
            status === 'on' ? 'bg-red-500' : 'bg-green-500'
          } text-foreground`}
          onClick={() => {
            // Aquí puedes manejar la acción del botón
            console.log(`Action for ${row.original.id}`)
          }}
        >
          {status === 'on' ? (
            <Pause className="text-foreground" />
          ) : (
            <Play className="text-foreground" />
          )}
        </Button>
      )
    },
  },
]
