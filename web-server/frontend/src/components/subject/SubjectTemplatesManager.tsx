import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useTemplates } from '@/hooks/useTemplates'
import { Trash } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SubjectTemplatesManagerProps {
  subjectId: string
}

export const SubjectTemplatesManager: React.FC<
  SubjectTemplatesManagerProps
> = ({ subjectId }) => {
  const { templates, loading, deleteTemplate } = useTemplates(subjectId)
  const { toast } = useToast()
  const [deleting, setDeleting] = React.useState<string | null>(null)

  const handleDelete = async (templateId: string) => {
    setDeleting(templateId)
    const result = await deleteTemplate(templateId)
    setDeleting(null)
    if (result.ok) {
      toast({
        title: 'Template deleted',
        description: 'Template deleted successfully.',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-2 text-xl font-semibold">Templates</h2>
      {loading && <div>Loading templates...</div>}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>vCPUs</TableHead>
              <TableHead>RAM (GB)</TableHead>
              <TableHead>Disk (GB)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(templates && templates.length > 0) ? (
              templates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell>{tpl.description}</TableCell>
                  <TableCell>{tpl.vcpuCount}</TableCell>
                  <TableCell>{(tpl.vramMB / 1024).toFixed(1)}</TableCell>
                  <TableCell>{(tpl.sizeMB / 1024).toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                      onClick={() => handleDelete(tpl.id)}
                      disabled={deleting === tpl.id}
                    >
                      {deleting === tpl.id ? (
                        'Deleting...'
                      ) : (
                        <>
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No templates found for this subject.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
