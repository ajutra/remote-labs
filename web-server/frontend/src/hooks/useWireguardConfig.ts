import { getEnv } from '@/utils/Env'
import { useState } from 'react'

export const useWireguardConfig = () => {
  const [config, setConfig] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const formatConfig = (rawConfig: string): string => {
    // Remove first and last character (quotes) and escape sequences
    let formatted = rawConfig.slice(1, -1).replace(/\\n/g, '\n')
    
    // Fix AllowedIPs format
    formatted = formatted.replace(/AllowedIPs = (.*?)(?=\n|$)/g, (match, ips) => {
      console.log('Original IPs:', ips)
      // Split by spaces and filter out empty strings
      const ipList = ips.split(/\s+/).filter(Boolean)
      console.log('IP List:', ipList)
      const result = `AllowedIPs = ${ipList.join(', ')}`
      console.log('Result:', result)
      return result
    })

    // Remove any trailing quote that might be left
    formatted = formatted.replace(/"$/, '')

    return formatted
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
      console.log('Raw config:', rawConfig)
      const formattedConfig = formatConfig(rawConfig)
      console.log('Formatted config:', formattedConfig)
      setConfig(formattedConfig)
    } catch (error) {
      console.error('Failed to fetch Wireguard configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return { config, isLoading, getConfig }
}
