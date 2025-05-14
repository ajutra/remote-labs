import React, { useState } from 'react'
import { SubjectManagementPanel } from './SubjectManagementPanel'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface SubjectManagementSheetProps {
  subjectId: string
}

export const SubjectManagementSheet: React.FC<SubjectManagementSheetProps> = ({
  subjectId,
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          aria-label="Manage subject"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="flex h-[90vh] w-full max-w-full flex-col"
      >
        <SheetHeader>
          <SheetTitle>Subject Management</SheetTitle>
          <SheetClose asChild>
            <Button variant="outline" className="absolute right-4 top-4">
              Close
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="mt-6 flex-1 overflow-auto">
          <SubjectManagementPanel subjectId={subjectId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
