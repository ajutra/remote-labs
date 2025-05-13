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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InfoIcon, Loader2 } from 'lucide-react'
import { useCreateInstance } from '@/hooks/useCreateInstance'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface RequestLabButtonProps {
  subjectId: string
  templateId: string
  onSuccess?: () => void
}

export const RequestLabButton: React.FC<RequestLabButtonProps> = ({
  subjectId,
  templateId,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { createInstance } = useCreateInstance()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.publicSshKeys || user.publicSshKeys.length === 0) {
      alert('You must have at least one SSH key to request a lab.')
      return
    }

    setLoading(true)
    try {
      const request = {
        userId: user.id,
        subjectId,
        sourceVmId: templateId,
        username,
        password,
        publicSshKeys: user.publicSshKeys,
        sizeMB: 1024, // Example value, replace with actual template data
        vcpuCount: 2, // Example value, replace with actual template data
        vramMB: 2048, // Example value, replace with actual template data
      }

      const response = await createInstance(request)

      // Extend loading state to handle potential CORS delays
      setTimeout(() => {
        setLoading(false)
        setOpen(false)
        setUsername('')
        setPassword('')
        if (response?.instanceId) {
          onSuccess?.()
          window.location.reload() // Reload the subject page
        }
      }, 60000) // Wait for 1 minute
    } catch (error) {
      console.error('Error requesting lab:', error)
      // Suppress error toast if response is null (CORS issue)
      setTimeout(() => {
        setLoading(false)
        setOpen(false)
        window.location.reload() // Reload the subject page
      }, 60000)
    }
  }

  if (!user?.publicSshKeys || user.publicSshKeys.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You must have at least one SSH key to request a lab.
        </p>
        <Button onClick={() => navigate('/user-settings')}>
          Manage SSH Keys
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && setOpen(isOpen)}>
      <DialogTrigger asChild>
        <Button>Request Lab</Button>
      </DialogTrigger>
      <DialogContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Your remote virtual lab is being created. This may take a few
              moments. If your machine does not appear after this loading state,
              please refresh the page before trying again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Request Lab</DialogTitle>
              <DialogDescription>
                Enter your VM credentials. These will be used to access your
                virtual machine.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  required
                />
              </div>

              <div className="rounded-lg border bg-muted p-4">
                <div className="flex items-center gap-2">
                  <InfoIcon className="h-4 w-4" />
                  <p className="text-sm">
                    This password can only be changed from within the virtual
                    machine using the old password. Please make sure to remember
                    it.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Requesting...' : 'Request Lab'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
