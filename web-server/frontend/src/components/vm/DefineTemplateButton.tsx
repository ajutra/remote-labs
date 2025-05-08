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

interface DefineTemplateButtonProps {
  vm: VMListItem
  onSuccess?: () => void
  isTeacherOrAdmin: boolean
}

export const DefineTemplateButton: React.FC<DefineTemplateButtonProps> = ({
  vm,
  onSuccess,
  isTeacherOrAdmin,
}) => {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const { defineTemplate, loading } = useDefineTemplate()

  if (!isTeacherOrAdmin) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await defineTemplate()
      setOpen(false)
      setDescription('')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Define Template</Button>
      </DialogTrigger>
      <DialogContent>
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
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
