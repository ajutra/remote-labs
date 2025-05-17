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
import { useLoginForm } from '@/hooks/forms/useLoginForm'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export function LoginForm({
  onLogin,
  onOpenRegister,
}: {
  onLogin: () => void
  onOpenRegister: () => void
}) {
  const { t } = useTranslation()
  const { emailRef, pwdRef, error, isLoading, handleSubmit } =
    useLoginForm(onLogin)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowForgotPassword(true)
  }

  return (
    <>
      <Card className="mx-auto max-w-sm border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t('Log In')}</CardTitle>
          <CardDescription>
            {t('Enter your email and password below to login to your account')}
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
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t('Password')}</Label>
              </div>
              <Input id="password" type="password" ref={pwdRef} required />
              <Button
                variant="link"
                className="text-foreground text-sm p-0 h-auto"
                onClick={handleForgotPasswordClick}
                type="button"
              >
                {t('Forgot Password?')}
              </Button>
            </div>
            {error && (
              <CardDescription className="text-destructive">
                {error}
              </CardDescription>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 animate-spin" />}
              {t('Log In')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t("Don't have an account?")}{' '}
            <Button
              variant="link"
              className="text-foreground"
              onClick={onOpenRegister}
            >
              {t('Sign Up')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogTitle>{t('Forgot Password')}</DialogTitle>
          <DialogDescription>
            {t('Enter your email address and we will send you a link to reset your password.')}
          </DialogDescription>
          <ForgotPasswordForm onClose={() => setShowForgotPassword(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default LoginForm
