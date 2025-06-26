import { useState } from 'react'

export function useSubjectTemplates() {
  // Mock de plantillas para UI
  const [templates] = useState([
    { id: 'tpl-1', description: 'Ubuntu 22.04 base' },
    { id: 'tpl-2', description: 'Windows 11 clean' },
  ])
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  // Stub actions
  const addTemplate = async (_template: unknown) => {}
  const removeTemplate = async (_templateId: string) => {}

  return { templates, loading, error, addTemplate, removeTemplate }
}
