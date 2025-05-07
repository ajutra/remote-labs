import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface Template {
  id: string
  name: string
  description: string
  vcpu_count: number
  vram_mb: number
  size_mb: number
  os: string
}

export const useTemplates = (subjectId: string) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // TODO: Remove mock data and uncomment real API call
        // const response = await fetch(
        //   `http://localhost:8080/templates/subject/${subjectId}`
        // )
        // if (!response.ok) {
        //   throw new Error('Failed to fetch templates')
        // }
        // const data = await response.json()
        // setTemplates(data)

        // Mock data for testing
        const mockTemplates: Template[] = [
          {
            id: 'template-1',
            name: 'Basic Ubuntu Lab',
            description:
              'A basic Ubuntu environment for introductory programming',
            vcpu_count: 2,
            vram_mb: 4096,
            size_mb: 20480,
            os: 'Ubuntu 22.04 LTS',
          },
          {
            id: 'template-2',
            name: 'Development Environment',
            description:
              'Full development environment with pre-installed tools',
            vcpu_count: 4,
            vram_mb: 8192,
            size_mb: 40960,
            os: 'Ubuntu 22.04 LTS',
          },
          {
            id: 'template-3',
            name: 'Data Science Lab',
            description:
              'Environment with Python, R, and data science libraries',
            vcpu_count: 8,
            vram_mb: 16384,
            size_mb: 81920,
            os: 'Ubuntu 22.04 LTS',
          },
        ]
        setTemplates(mockTemplates)
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load templates',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [subjectId, toast])

  return { templates, loading }
}
