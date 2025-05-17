import { useState } from 'react'
import { getEnv } from '@/utils/Env'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'

export interface CreateInstanceFrontendRequest {
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
  const { user } = useAuth()

  const createInstance = async (request: CreateInstanceFrontendRequest) => {
    if (!user?.id) {
      throw new Error('User ID is required')
    }
    if (!user?.publicSshKeys) {
      throw new Error('SSH keys are required')
    }

    setLoading(true)
    try {
      const fullRequest = {
        ...request,
        userId: user.id,
        publicSshKeys: user.publicSshKeys,
      }
      console.log('Sending request payload:', fullRequest)
      const response = await fetch(getEnv().API_CREATE_INSTANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullRequest),
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
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { createInstance, loading }
}
