import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDefineTemplate } from '@/hooks/useDefineTemplate'
import { VMListItem } from '@/types/vm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface DefineTemplateButtonProps {
  vm: VMListItem
  isTeacherOrAdmin: boolean
}

export const DefineTemplateButton: React.FC<DefineTemplateButtonProps> = ({
  vm,
  isTeacherOrAdmin,
}) => {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [vcpuCount, setVcpuCount] = useState(4) // Default to 4 CPUs
  const [vramGB, setVramGB] = useState(4) // Default to 4 GB RAM
  const [sizeGB, setSizeGB] = useState(5) // Default to 5 GB Disk
  const { defineTemplate } = useDefineTemplate()
  const [loading, setLoading] = useState(false)

  if (!isTeacherOrAdmin) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await defineTemplate({
        sourceInstanceId: vm.instanceId,
        sizeMB: sizeGB * 1024,
        vcpuCount,
        vramMB: vramGB * 1024,
        subjectId: vm.subjectId,
        description,
        isValidated: true,
      })
      setTimeout(() => {
        setLoading(false)
        setOpen(false)
        window.location.reload() // Refresh the page after completion
      }, 60000) // Wait for 1 minute
    } catch (error) {
      console.error('Error defining template:', error)
      setTimeout(() => {
        setLoading(false)
        setOpen(false)
        window.location.reload() // Refresh the page after completion
      }, 60000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && setOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button variant="outline">Define Template</Button>
      </DialogTrigger>
      <DialogContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Your template is being created. This may take a few moments. If it
              does not appear after this loading state, please refresh the page
              before trying again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Define Template from VM</DialogTitle>
              <DialogDescription>
                Create a new template based on this VM configuration.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter template description..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vcpu">vCPUs</Label>
                <Select
                  value={vcpuCount.toString()}
                  onValueChange={(value) => setVcpuCount(Number(value))}
                >
                  <SelectTrigger id="vcpu">
                    <SelectValue placeholder="Select vCPUs" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6, 8, 10, 12, 14, 16].map((cpu) => (
                      <SelectItem key={cpu} value={cpu.toString()}>
                        {cpu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vram">RAM (GB)</Label>
                <Select
                  value={vramGB.toString()}
                  onValueChange={(value) => setVramGB(Number(value))}
                >
                  <SelectTrigger id="vram">
                    <SelectValue placeholder="Select RAM" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 4, 8, 16, 32].map((ram) => (
                      <SelectItem key={ram} value={ram.toString()}>
                        {ram} GB
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="disk">Disk Size (GB)</Label>
                <Select
                  value={sizeGB.toString()}
                  onValueChange={(value) => setSizeGB(Number(value))}
                >
                  <SelectTrigger id="disk">
                    <SelectValue placeholder="Select Disk Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((disk) => (
                      <SelectItem key={disk} value={disk.toString()}>
                        {disk} GB
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
