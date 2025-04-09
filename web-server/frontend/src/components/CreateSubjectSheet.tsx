import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
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

const CreateSubjectSheet: React.FC = () => {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: 'Subject Created',
      description: 'The subject has been created successfully.',
    })
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
    useQcow2,
    setUseQcow2,
    qcow2File,
    setQcow2File,
  } = useCreateSubject(handleSuccess)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">Create a new subject</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2/3 h-full w-full sm:w-2/3">
        <SheetHeader>
          <SheetTitle>Create a new subject</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new subject.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-full">
          <div className="space-y-4">
            <div>
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Enter subject name"
              />
              {error === 'Subject name is required' && (
                <p className="text-red-500">{error}</p>
              )}
            </div>
            <div>
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input
                id="subjectCode"
                value={subjectCode}
                onChange={handleSubjectCodeChange}
                placeholder="Enter subject code"
              />
              <p className="text-sm text-muted-foreground">
                Subject code must be numeric
              </p>
              {codeError && <p className="text-red-500">{codeError}</p>}
              {error === 'Subject code is required' && (
                <p className="text-red-500">{error}</p>
              )}
            </div>
            <div>
              <Label htmlFor="professorEmails">Professor Emails</Label>
              <div className="flex space-x-2">
                <Input
                  id="professorEmails"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter professor email"
                />
                <Button onClick={handleAddEmail}>Add</Button>
              </div>
              {error === 'Email must be a valid @tecnocampus.cat address' && (
                <p className="text-red-500">{error}</p>
              )}
              <div className="mt-2 space-y-1">
                {professorEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between"
                  >
                    <span>{email}</span>
                    <Button
                      variant="destructive"
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
              />
              <p className="text-sm text-muted-foreground">
                Enter each student email on a new line
              </p>
            </div>

            {/* VM Configuration Section */}
            <div className="border-t pt-4">
              <h3 className="mb-4 text-lg font-semibold">
                Virtual Machine Configuration
              </h3>

              <div className="mb-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useQcow2"
                  checked={useQcow2}
                  onChange={(e) => setUseQcow2(e.target.checked)}
                />
                <Label htmlFor="useQcow2">Use existing qcow2 image</Label>
              </div>

              {useQcow2 ? (
                <div>
                  <Label htmlFor="qcow2">Qcow2 Image File</Label>
                  <Input
                    id="qcow2"
                    type="file"
                    accept=".qcow2"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setQcow2File(e.target.files[0])
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <Label htmlFor="vmOs">Operating System</Label>
                    <Select value={vmOs} onValueChange={setVmOs}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select OS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debian12">Debian 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="vmRam">RAM (GB)</Label>
                      <Input
                        id="vmRam"
                        type="number"
                        min="1"
                        max="32"
                        value={vmRam}
                        onChange={(e) => setVmRam(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vmCpu">CPU Cores</Label>
                      <Input
                        id="vmCpu"
                        type="number"
                        min="1"
                        max="16"
                        value={vmCpu}
                        onChange={(e) => setVmCpu(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vmStorage">Storage (GB)</Label>
                      <Input
                        id="vmStorage"
                        type="number"
                        min="10"
                        max="1000"
                        value={vmStorage}
                        onChange={(e) => setVmStorage(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <SheetClose asChild>
              <Button onClick={handleCreateSubject}>Create Subject</Button>
            </SheetClose>
            {error === 'Some student emails are invalid' && (
              <p className="text-red-500">{error}</p>
            )}
            {validationResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold">Validation Results</h3>
                <table className="mt-2 w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">
                        Email
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        Valid
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.map((result, index) => (
                      <tr
                        key={index}
                        className={result.valid ? 'bg-green-100' : 'bg-red-100'}
                      >
                        <td className="border border-gray-300 px-2 py-1">
                          {result.email}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {result.valid ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default CreateSubjectSheet
