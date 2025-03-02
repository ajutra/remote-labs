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

  return (
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
  )
}

export default LoginForm
