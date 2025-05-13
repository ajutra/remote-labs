import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getEnv } from '@/utils/Env'

export interface DefineTemplateParams {
  sourceInstanceId: string
  sizeMB: number
  vcpuCount: number
  vramMB: number
  subjectId: string
  description: string
  isValidated: boolean
}

export const useDefineTemplate = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const defineTemplate = async (params: DefineTemplateParams) => {
    setLoading(true)
    try {
      const response = await fetch(
        getEnv().API_BASE_URL + '/templates/define',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to create template')
      }
      toast({
        title: 'Template created',
        description: 'The template has been created successfully.',
      })
    } catch (error) {
      console.error('Error creating template:', error)

      throw error
    } finally {
      setLoading(false)
    }
  }

  return { defineTemplate, loading }
}
