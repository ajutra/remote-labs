import { useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

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
      await api.post('/templates', params)
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
