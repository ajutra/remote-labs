import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { useToast } from '@/hooks/use-toast'
import useCreateSubject from '@/hooks/useCreateSubject'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { AlertCircle } from 'lucide-react'
import VirtualMachineConfig from './VirtualMachineConfig'
import { Checkbox } from './ui/checkbox'
import { useAuth } from '@/context/AuthContext'

const CreateSubjectSheet: React.FC = () => {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [customizeVm, setCustomizeVm] = React.useState(false)
  const [vmUsername, setVmUsername] = React.useState('')
  const [vmPassword, setVmPassword] = React.useState('')
  const { user } = useAuth()

  // Set default values for VM configuration
  React.useEffect(() => {
    setVmOs('debian12')
    setVmRam('4')
    setVmCpu('2')
    setVmStorage('10')
  }, [])

  const handleSuccess = () => {
    toast({
      title: 'Subject Created',
      description: 'The subject has been created successfully.',
    })
    setOpen(false)
  }

  const {
    subjectName,
    setSubjectName,
    subjectCode,
    handleSubjectCodeChange,
    professorEmails,
    emailInput,
    setEmailInput,
    studentEmails,
    setStudentEmails,
    error,
    codeError,
    validationResults,
    handleAddEmail,
    handleRemoveEmail,
    handleCreateSubject,
    // VM Configuration
    vmOs,
    setVmOs,
    vmRam,
    setVmRam,
    vmCpu,
    setVmCpu,
    vmStorage,
    setVmStorage,
    templateDescription,
    setTemplateDescription,
    isLoadingBases,
    bases,
  } = useCreateSubject(handleSuccess)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (customizeVm) {
      if (!vmUsername || !vmPassword) {
        toast({
          title: 'Error',
          description:
            'Please fill in all virtual machine configuration fields.',
          variant: 'destructive',
        })
        return
      }
      if (!user?.publicSshKeys || user.publicSshKeys.length === 0) {
        toast({
          title: 'Error',
          description:
            'You must have at least one SSH key to create a subject with a customized virtual machine.',
          variant: 'destructive',
        })
        return
      }
    }
    if (!vmOs || !vmRam || !vmCpu || !vmStorage) {
      toast({
        title: 'Error',
        description: 'Please select all virtual machine configuration options.',
        variant: 'destructive',
      })
      return
    }
    await handleCreateSubject()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full">Create a new subject</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2/3 h-full w-full sm:w-2/3">
        <SheetHeader>
          <SheetTitle>Create a new subject</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new subject. All fields are
            required.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Enter subject name"
                className={
                  error === 'Subject name is required' ? 'border-red-500' : ''
                }
              />
              {error === 'Subject name is required' && (
                <p className="mt-1 text-sm text-red-500">
                  Subject name is required
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input
                id="subjectCode"
                value={subjectCode}
                onChange={handleSubjectCodeChange}
                placeholder="Enter subject code"
                className={
                  codeError || error === 'Subject code is required'
                    ? 'border-red-500'
                    : ''
                }
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Subject code must be numeric
              </p>
              {codeError && (
                <p className="mt-1 text-sm text-red-500">{codeError}</p>
              )}
              {error === 'Subject code is required' && (
                <p className="mt-1 text-sm text-red-500">
                  Subject code is required
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="professorEmails">Other Professors' Emails</Label>
              <div className="flex space-x-2">
                <Input
                  id="professorEmails"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter professor email"
                  className={
                    error === 'Email must be a valid @tecnocampus.cat address'
                      ? 'border-red-500'
                      : ''
                  }
                />
                <Button type="button" onClick={handleAddEmail}>
                  Add
                </Button>
              </div>
              {error === 'Email must be a valid @tecnocampus.cat address' && (
                <p className="mt-1 text-sm text-red-500">
                  Email must be a valid @tecnocampus.cat address
                </p>
              )}
              <div className="mt-2 space-y-1">
                {professorEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-md bg-muted p-2"
                  >
                    <span className="text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="studentEmails">Student Emails</Label>
              <Textarea
                id="studentEmails"
                value={studentEmails}
                onChange={(e) => setStudentEmails(e.target.value)}
                placeholder="Enter student emails, one per line"
                rows={5}
                className={
                  error === 'Some student emails are invalid'
                    ? 'border-red-500'
                    : ''
                }
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Enter each student email on a new line
              </p>
              {error === 'Some student emails are invalid' && (
                <p className="mt-1 text-sm text-red-500">
                  Some student emails are invalid
                </p>
              )}
            </div>

            {/* VM Configuration Section */}
            <div className="border-t pt-4">
              <h3 className="mb-4 text-lg font-semibold">
                Virtual Machine Configuration
              </h3>

              <div className="mb-4">
                <Label htmlFor="vmOs">Operating System</Label>
                <Select value={vmOs} onValueChange={setVmOs} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBases ? (
                      <SelectItem value="loading" disabled>
                        Loading operating systems...
                      </SelectItem>
                    ) : bases.length === 0 ? (
                      <SelectItem value="no-bases" disabled>
                        No operating systems available
                      </SelectItem>
                    ) : (
                      bases.map((base) => (
                        <SelectItem key={base.base_id} value={base.base_id}>
                          {base.description}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {bases.length === 0 && !isLoadingBases && (
                  <p className="mt-1 text-sm text-red-500">
                    Please ensure the server is running and try again
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vmRam">RAM (GB)</Label>
                  <Select value={vmRam} onValueChange={setVmRam} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RAM" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 4, 8, 16, 32].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value} GB
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vmCpu">CPU Cores</Label>
                  <Select value={vmCpu} onValueChange={setVmCpu} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CPU Cores" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 4, 6, 8, 10, 12, 14, 16].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value} Cores
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vmStorage">Storage (GB)</Label>
                  <Select
                    value={vmStorage}
                    onValueChange={setVmStorage}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Storage" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 50 }, (_, i) => i + 1).map(
                        (value) => (
                          <SelectItem key={value} value={value.toString()}>
                            {value} GB
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="templateDescription">
                  Template Description
                </Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter a description for this template"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  This description will help identify this template if there are
                  multiple templates for this subject.
                </p>
              </div>

              <div className="mt-4">
                <Checkbox
                  id="customizeVm"
                  checked={customizeVm}
                  onChange={(e) => setCustomizeVm(e.target.checked)}
                  label="Customize virtual machine before creating template"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  If enabled, you will be able to configure the virtual machine
                  before creating the template. This allows you to install
                  additional software and configure the system according to your
                  needs.
                </p>
              </div>

              {customizeVm && (
                <div className="mt-4">
                  <VirtualMachineConfig
                    username={vmUsername}
                    setUsername={setVmUsername}
                    password={vmPassword}
                    setPassword={setVmPassword}
                    error={error}
                  />
                </div>
              )}
            </div>

            {validationResults.length > 0 && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Validation Results
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc space-y-1 pl-5">
                        {validationResults.map((result, index) => (
                          <li key={index}>
                            {result.email}: {result.valid ? 'Valid' : 'Invalid'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Subject</Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default CreateSubjectSheet
