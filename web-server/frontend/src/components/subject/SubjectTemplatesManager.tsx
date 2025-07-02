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
import { Trash, Plus, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDefineTemplate } from '@/hooks/useDefineTemplate'
import { getEnv } from '@/utils/Env'

interface SubjectTemplatesManagerProps {
  subjectId: string
}

interface Base {
  baseId: string
  description: string
}

const RAM_OPTIONS = ['1', '2', '4', '8', '16']
const CPU_OPTIONS = ['2', '4', '6', '8', '10', '12', '14', '16']
const STORAGE_OPTIONS = Array.from({ length: 49 }, (_, i) => String(i + 2)) // 2 to 50

export const SubjectTemplatesManager: React.FC<SubjectTemplatesManagerProps> = ({
  subjectId,
}) => {
  const { templates, loading, deleteTemplate, fetchTemplates } = useTemplates(subjectId)
  const { toast } = useToast()
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [bases, setBases] = React.useState<Base[]>([])
  const [isLoadingBases, setIsLoadingBases] = React.useState(true)
  const [selectedBase, setSelectedBase] = React.useState('')
  const [templateDescription, setTemplateDescription] = React.useState('')
  const [vmRam, setVmRam] = React.useState('1')
  const [vmCpu, setVmCpu] = React.useState('2')
  const [vmStorage, setVmStorage] = React.useState('2')
  const { defineTemplate, loading: isDefiningTemplate } = useDefineTemplate()

  React.useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetch(getEnv().API_BASES)
        const data = await response.json()
        if (Array.isArray(data)) {
          setBases(data)
        }
      } catch (error) {
        console.error('Error fetching bases:', error)
        toast({
          title: 'Error',
          description: 'Failed to load bases',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingBases(false)
      }
    }
    fetchBases()
  }, [toast])

  const handleDelete = async (templateId: string) => {
    setDeleting(templateId)
    const result = await deleteTemplate(templateId)
    setDeleting(null)
    if (result.ok) {
      await fetchTemplates()
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

  const handleCreateTemplate = async () => {
    if (!selectedBase || !templateDescription) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await defineTemplate({
        sourceInstanceId: selectedBase,
        sizeMB: parseInt(vmStorage) * 1024,
        vcpuCount: parseInt(vmCpu),
        vramMB: parseInt(vmRam) * 1024,
        subjectId: subjectId,
        description: templateDescription,
        isValidated: true,
      })

      await fetchTemplates()

      toast({
        title: 'Success',
        description: 'Template created successfully',
      })
      setSelectedBase('')
      setTemplateDescription('')
      setVmRam('1')
      setVmCpu('2')
      setVmStorage('2')
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
          Templates
          <Button
            variant="outline"
            size="icon"
            className="ml-2 rounded-full border-yellow-400 text-yellow-600 shadow-sm hover:bg-yellow-100 hover:text-yellow-800 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
            onClick={() => setOpen(true)}
            aria-label="Create template"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </h2>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new template</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new template. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            {isLoadingBases ? (
              <div>Loading bases...</div>
            ) : bases.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <h4 className="font-medium">No bases available</h4>
                  <p className="text-sm">
                    The service is currently not available to provide base templates.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="base">Base Template</Label>
                  <Select
                    value={selectedBase}
                    onValueChange={setSelectedBase}
                    disabled={isLoadingBases}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a base template" />
                    </SelectTrigger>
                    <SelectContent>
                      {bases.map((base) => (
                        <SelectItem key={base.baseId} value={base.baseId}>
                          {base.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Enter template description"
                  />
                </div>
                <div>
                  <Label htmlFor="vmRam">RAM (GB)</Label>
                  <Select value={vmRam} onValueChange={setVmRam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RAM size" />
                    </SelectTrigger>
                    <SelectContent>
                      {RAM_OPTIONS.map((ram) => (
                        <SelectItem key={ram} value={ram}>
                          {ram} GB
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vmCpu">vCPUs</Label>
                  <Select value={vmCpu} onValueChange={setVmCpu}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of vCPUs" />
                    </SelectTrigger>
                    <SelectContent>
                      {CPU_OPTIONS.map((cpu) => (
                        <SelectItem key={cpu} value={cpu}>
                          {cpu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vmStorage">Storage (GB)</Label>
                  <Select value={vmStorage} onValueChange={setVmStorage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage size" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_OPTIONS.map((storage) => (
                        <SelectItem key={storage} value={storage}>
                          {storage} GB
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={isDefiningTemplate || !selectedBase || !templateDescription}
                  className="w-full"
                >
                  {isDefiningTemplate ? 'Creating...' : 'Create Template'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
            {templates && templates.length > 0 ? (
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
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
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
