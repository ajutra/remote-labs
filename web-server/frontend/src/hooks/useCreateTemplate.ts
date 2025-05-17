import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getEnv } from '@/utils/Env'

interface CreateTemplateParams {
  name: string
  description: string
  vcpu_count: number
  vram_mb: number
  size_mb: number
  os: string
  instance_id: string
}

export const useCreateTemplate = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createTemplate = async (params: CreateTemplateParams) => {
    setLoading(true)
    try {
      await fetch(`${getEnv().API_CREATE_TEMPLATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      toast({
        title: 'Template created',
        description: 'The template has been created successfully.',
      })
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: 'Error',
        description: 'Failed to create template. Please try again.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { createTemplate, loading }
}
