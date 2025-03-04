import React, { useEffect, useState } from 'react'
import { DataTable } from '@/components/labs/data-table'
import { columns, Lab } from '@/components/labs/colums'

const MyLabs: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Datos de prueba
    const mockLabs: Lab[] = [
      {
        id: '1',
        subject: 'Mathematics',
        machineName: 'Machine A',
        status: 'on',
      },
      {
        id: '2',
        subject: 'Physics',
        machineName: 'Machine B',
        status: 'off',
      },
      {
        id: '3',
        subject: 'Chemistry',
        machineName: 'Machine C',
        status: 'on',
      },
      {
        id: '4',
        subject: 'Biology',
        machineName: 'Machine D',
        status: 'off',
      },
    ]

    // Simular carga de datos
    setTimeout(() => {
      setLabs(mockLabs)
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">My Labs</h1>
      <DataTable columns={columns} data={labs} />
    </div>
  )
}

export default MyLabs
