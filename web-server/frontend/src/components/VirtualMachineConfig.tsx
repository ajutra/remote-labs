import React from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { useAuth } from '@/context/AuthContext'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { AppRoutes } from '@/enums/AppRoutes'

interface VirtualMachineConfigProps {
  username: string
  setUsername: (value: string) => void
  password: string
  setPassword: (value: string) => void
  error?: string
}

const VirtualMachineConfig: React.FC<VirtualMachineConfigProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  error,
}) => {
  const { user } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="vmUsername">Virtual Machine Username</Label>
        <Input
          id="vmUsername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username for the virtual machine"
          className={error === 'Username is required' ? 'border-red-500' : ''}
        />
        {error === 'Username is required' && (
          <p className="mt-1 text-sm text-red-500">Username is required</p>
        )}
      </div>

      <div>
        <Label htmlFor="vmPassword">Virtual Machine Password</Label>
        <div className="relative">
          <Input
            id="vmPassword"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password for the virtual machine"
            className={error === 'Password is required' ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error === 'Password is required' && (
          <p className="mt-1 text-sm text-red-500">Password is required</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Note: This password is for the virtual machine user account, not your
          platform account. It cannot be recovered if lost and can only be
          changed from within the virtual machine.
        </p>
      </div>

      <div>
        <Label>SSH Keys</Label>
        <div className="rounded-md bg-muted p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Available SSH Keys</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = AppRoutes.USER_SETTINGS)}
            >
              Manage Keys
            </Button>
          </div>
          {user?.publicSshKeys && user.publicSshKeys.length > 0 ? (
            <ul className="space-y-2">
              {user.publicSshKeys.map((key, index) => (
                <li key={index} className="break-all text-sm">
                  {key}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p>
                No SSH keys found. Please add SSH keys in your profile settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VirtualMachineConfig
