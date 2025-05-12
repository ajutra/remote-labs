import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Template } from '@/hooks/useTemplates'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestLabButton } from './RequestLabButton'

interface TemplateSelectorProps {
  templates: Template[]
  loading: boolean
  subjectId: string
  onRequestSuccess?: () => void
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  loading,
  subjectId,
  onRequestSuccess,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

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
                    <p className="font-medium">{template.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <p>vCPUs: {template.vcpuCount}</p>
                      <p>RAM: {template.vramMB / 1024} GB</p>
                      <p>Disk: {template.sizeMB / 1024} GB</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && (
          <RequestLabButton
            subjectId={subjectId}
            templateId={selectedTemplate}
            onSuccess={onRequestSuccess}
          />
        )}
      </CardContent>
    </Card>
  )
}
