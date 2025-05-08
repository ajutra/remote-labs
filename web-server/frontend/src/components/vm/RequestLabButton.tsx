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
import { InfoIcon } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // La lógica de API se implementará después
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setOpen(false)
      setUsername('')
      setPassword('')
      onSuccess?.()
    } catch (error) {
      console.error('Error requesting lab:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Request Lab</Button>
      </DialogTrigger>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  )
}
