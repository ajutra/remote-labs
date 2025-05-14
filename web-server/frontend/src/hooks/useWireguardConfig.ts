import { getEnv } from '@/utils/Env'
import { useState } from 'react'

export const useWireguardConfig = () => {
  const [config, setConfig] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const formatConfig = (rawConfig: string): string => {
    return rawConfig.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
  }

  const getConfig = async (instanceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        getEnv().API_GET_WIREGUARD.replace('{instanceId}', instanceId),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch Wireguard configuration')
      }
      const rawConfig = await response.text()
      const formattedConfig = formatConfig(rawConfig)
      setConfig(formattedConfig)
    } catch (error) {
      console.error('Failed to fetch Wireguard configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return { config, isLoading, getConfig }
}
