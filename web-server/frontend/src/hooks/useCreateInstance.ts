import { useState } from 'react'
import { getEnv } from '@/utils/Env'
import { useToast } from '@/hooks/use-toast'

export interface CreateInstanceFrontendRequest {
  userId: string
  subjectId: string
  sourceVmId: string
  username: string
  password: string
  publicSshKeys: string[]
  sizeMB: number
  vcpuCount: number
  vramMB: number
}

export const useCreateInstance = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createInstance = async (request: CreateInstanceFrontendRequest) => {
    setLoading(true)
    try {
      console.log('Sending request payload:', request)
      const response = await fetch(getEnv().API_CREATE_INSTANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error('Failed to create instance')
      }

      const responseData = await response.json()
      console.log('Received response:', responseData)

      toast({
        title: 'Success',
        description: 'Instance created successfully',
        variant: 'default',
      })

      return responseData
    } catch (error) {
      console.log('Continue creating the instance... but nav say', error)
    } finally {
      setLoading(false)
    }
  }

  return { createInstance, loading }
}
