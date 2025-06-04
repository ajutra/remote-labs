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
import { InfoIcon, Loader2, Eye, EyeOff } from 'lucide-react'
import { useCreateInstance } from '@/hooks/useCreateInstance'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

interface RequestLabButtonProps {
  subjectId: string
  templateId: string
  vcpuCount: number
  vramMB: number
  sizeMB: number
  onSuccess?: () => void
}

export const RequestLabButton: React.FC<RequestLabButtonProps> = ({
  subjectId,
  templateId,
  vcpuCount,
  vramMB,
  sizeMB,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { createInstance } = useCreateInstance()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const validateUsername = (username: string) => {
    // Only allow lowercase letters, numbers, and underscores
    return /^[a-z0-9_]+$/.test(username)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    if (validateUsername(value) || value === '') {
      setUsername(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.publicSshKeys || user.publicSshKeys.length === 0) {
      alert('You must have at least one SSH key to request a lab.')
      return
    }

    if (!validateUsername(username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username can only contain lowercase letters, numbers, and underscores.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const request = {
        subjectId,
        sourceVmId: templateId,
        username,
        password,
        vcpuCount,
        vramMB,
        sizeMB,
        publicSshKeys: user.publicSshKeys,
      }

      const response = await createInstance(request)
      if (response?.instanceId) {
        setLoading(false)
        setOpen(false)
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        onSuccess?.()
        window.location.reload() // Reload the subject page
      } else {
        throw new Error('No instance ID received')
      }
    } catch (error) {
      console.error('Error requesting lab:', error)
      setLoading(false)
      setOpen(false)
      toast({
        title: 'Error',
        description: 'Failed to create lab. Please try again.',
        variant: 'destructive',
      })
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
                  onChange={handleUsernameChange}
                  placeholder="Enter username (lowercase letters, numbers, and underscores only)..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and underscores are allowed
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password..."
                  required
                  className={confirmPassword && password !== confirmPassword ? "border-red-500" : ""}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">
                    Passwords do not match
                  </p>
                )}
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
              <Button type="submit" disabled={loading || password !== confirmPassword}>
                {loading ? 'Requesting...' : 'Request Lab'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
