import { useState, useEffect, useRef } from 'react'
import { getEnv } from '@/utils/Env'

export interface ServerStatus {
  serverIp: string
  cpuLoad: number
  totalMemoryMB: number
  freeMemoryMB: number
  totalDiskMB: number
  freeDiskMB: number
  runningInstances: string[]
}

const HISTORY_SIZE = 10
const FETCH_INTERVAL = 10000 // 10 seconds

interface ServerHistory {
  cpu: number[]
  ram: number[]
  disk: number[]
}

export const useServerStatus = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const historyRef = useRef<{ [key: string]: ServerHistory }>({})

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        console.log('Fetching server status...')
        const response = await fetch(`${getEnv().API_GET_SERVER_STATUS}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Server status fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            contentType: response.headers.get('content-type')
          })
          throw new Error('Failed to fetch server status')
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Invalid content type:', contentType)
          throw new Error('Invalid response format')
        }

        const data = await response.json()
        console.log('Server status data received:', data)

        // Actualizar el historial para cada servidor
        data.forEach((server: ServerStatus) => {
          if (!historyRef.current[server.serverIp]) {
            historyRef.current[server.serverIp] = {
              cpu: Array(HISTORY_SIZE).fill(0),
              ram: Array(HISTORY_SIZE).fill(0),
              disk: Array(HISTORY_SIZE).fill(0)
            }
          }

          // Desplazar los valores antiguos y añadir los nuevos
          historyRef.current[server.serverIp].cpu.shift()
          historyRef.current[server.serverIp].cpu.push(server.cpuLoad * 100)

          historyRef.current[server.serverIp].ram.shift()
          historyRef.current[server.serverIp].ram.push(
            ((server.totalMemoryMB - server.freeMemoryMB) / server.totalMemoryMB) * 100
          )

          historyRef.current[server.serverIp].disk.shift()
          historyRef.current[server.serverIp].disk.push(
            ((server.totalDiskMB - server.freeDiskMB) / server.totalDiskMB) * 100
          )
        })

        setServerStatus(data)
        setError(null)
      } catch (err) {
        console.error('Error in server status fetch:', err)
        if (err instanceof Error) {
          console.error('Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
          })
        }
        setError('Servers are currently unavailable for status monitoring')
      } finally {
        setLoading(false)
      }
    }

    fetchServerStatus()
    const interval = setInterval(fetchServerStatus, FETCH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return { 
    serverStatus, 
    loading, 
    error,
    history: historyRef.current 
  }
} 