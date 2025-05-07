import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Template } from '@/hooks/useTemplates'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TemplateSelectorProps {
  templates: Template[]
  loading: boolean
  onRequest: (templateId: string) => Promise<void>
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  loading,
  onRequest,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [requesting, setRequesting] = useState(false)

  const handleRequest = async () => {
    if (!selectedTemplate) return
    setRequesting(true)
    try {
      await onRequest(selectedTemplate)
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">No templates available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Lab</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Template</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="space-y-1">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>vCPUs: {template.vcpu_count}</p>
                      <p>RAM: {template.vram_mb} MB</p>
                      <p>Disk: {template.size_mb} MB</p>
                      <p>OS: {template.os}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleRequest}
          disabled={!selectedTemplate || requesting}
        >
          {requesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Request Lab
        </Button>
      </CardContent>
    </Card>
  )
}
