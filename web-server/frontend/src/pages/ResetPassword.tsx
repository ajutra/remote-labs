import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getEnv } from '@/utils/Env'
import { PasswordRequirements, isPasswordValid } from '@/components/forms/PasswordRequirements'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t('Invalid Reset Link')}</CardTitle>
            <CardDescription>
              {t('This password reset link is invalid or has expired.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              {t('Back to Login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmPasswordRef.current) return

    const confirmPassword = confirmPasswordRef.current.value

    if (password !== confirmPassword) {
      setError(t('Passwords do not match'))
      return
    }

    if (!isPasswordValid(password)) {
      setError(t('Password does not meet the requirements'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${getEnv().API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to reset password')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t('Password Reset Successful')}</CardTitle>
            <CardDescription>
              {t('Your password has been reset successfully. You can now log in with your new password.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              {t('Back to Login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('Reset Password')}</CardTitle>
          <CardDescription>
            {t('Enter your new password below.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">{t('New Password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordRequirements password={password} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t('Confirm Password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                ref={confirmPasswordRef}
                required
              />
            </div>
            {error && (
              <CardDescription className="text-destructive">
                {error}
              </CardDescription>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isPasswordValid(password)}
            >
              {isLoading && <Loader2 className="mr-2 animate-spin" />}
              {t('Reset Password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 