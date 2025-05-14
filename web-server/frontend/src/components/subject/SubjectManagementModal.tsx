import React, { useState } from 'react'
import { SubjectManagementPanel } from './SubjectManagementPanel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface SubjectManagementModalProps {
  subjectId: string
}

export const SubjectManagementModal: React.FC<SubjectManagementModalProps> = ({
  subjectId,
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          aria-label="Manage subject"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] w-[98vw] max-w-6xl flex-col items-center justify-center">
        <DialogHeader className="flex w-full flex-row items-center justify-between">
          <DialogTitle>Subject Management</DialogTitle>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogHeader>
        <div className="mt-6 w-full flex-1 overflow-auto">
          <SubjectManagementPanel subjectId={subjectId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
