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
import { getEnv } from '@/utils/Env'

export function ForgotPasswordForm({
  onClose,
}: {
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${getEnv().API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailRef.current.value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send reset email')
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
      <Card className="mx-auto max-w-sm border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t('Check Your Email')}</CardTitle>
          <CardDescription>
            {t('We are generating a secure token with a reset link that will be valid for 24 hours. The email may take a few minutes to arrive. If you request another reset link, a new token will be generated and the previous link will no longer be valid.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onClose} className="w-full">
            {t('Close')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-sm border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{t('Forgot Password')}</CardTitle>
        <CardDescription>
          {t('Enter your email address and we will send you a link to reset your password.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t('Email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('Your email')}
              ref={emailRef}
              required
            />
          </div>
          {error && (
            <CardDescription className="text-destructive">
              {error}
            </CardDescription>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 animate-spin" />}
              {t('Send Reset Link')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ForgotPasswordForm 