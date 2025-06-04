import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getEnv } from '@/utils/Env'

export interface Template {
  id: string
  description: string
  vcpuCount: number
  vramMB: number
  sizeMB: number
}

export const useTemplates = (subjectId: string) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching templates for subject ID:', subjectId)
      const response = await fetch(
        getEnv().API_GET_TEMPLATES.replace('{subjectId}', subjectId),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data: Array<{
        id: string
        description: string
        vcpuCount: number
        vramMB: number
        sizeMB: number
      }> = await response.json()
      console.log('Fetched templates:', data)

      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [subjectId, toast])

  const deleteTemplate = async (
    templateId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const apiUrl = getEnv()
        .API_DELETE_TEMPLATE.replace('{templateId}', templateId)
        .replace('{subjectId}', subjectId)
      const response = await fetch(apiUrl, { method: 'DELETE' })
      if (!response.ok) {
        const errorText = await response.text()
        return { ok: false, error: errorText || 'Failed to delete template' }
      }
      await fetchTemplates()
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [subjectId, toast])

  return { templates, loading, deleteTemplate, fetchTemplates }
}
