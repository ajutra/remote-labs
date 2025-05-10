import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface DefineTemplateParams {
  name: string
  description: string
  vcpu_count: number
  vram_mb: number
  size_mb: number
  base: string
  instance_id: string
}

export const useDefineTemplate = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const defineTemplate = async (params: DefineTemplateParams) => {
    setLoading(true)
    try {
      const response = await fetch('/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      if (!response.ok) {
        throw new Error('Failed to create template')
      }
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

  return { defineTemplate, loading }
}
