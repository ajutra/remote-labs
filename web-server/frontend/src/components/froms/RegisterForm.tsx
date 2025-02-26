import React from 'react'
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
import { useRegisterForm } from '@/hooks/forms/useRegisterForm'

export function RegisterForm({ onRegister }: { onRegister: () => void }) {
  const { t } = useTranslation()
  const {
    nameRef,
    emailRef,
    pwdRef,
    pwdCheckRef,
    errors,
    isLoading,
    handleSubmit,
  } = useRegisterForm(onRegister)

  return (
    <Card className="mx-auto max-w-sm border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{t('Sign Up')}</CardTitle>
        <CardDescription>
          {t(
            'Enter your name, email and password below to sign up for an account'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('Name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('Name Surname')}
              ref={nameRef}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t('Email')}</Label>
            <Input
              id="mail"
              type="email"
              placeholder={t('Your email')}
              ref={emailRef}
              required
              pattern="^[^@\s]+@edu\.tecnocampus\.cat$"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t('Password')}</Label>
            <Input id="password" type="password" ref={pwdRef} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passwordCheck">{t('Confirm Password')}</Label>
            <Input
              id="passwordCheck"
              type="password"
              ref={pwdCheckRef}
              required
            />
          </div>

          {/* Mostrar los errores correspondientes */}
          {errors.email && (
            <CardDescription className="text-destructive">
              {errors.email}
            </CardDescription>
          )}
          {errors.password && (
            <CardDescription className="text-destructive">
              {errors.password}
            </CardDescription>
          )}
          {errors.passwordMatch && (
            <CardDescription className="text-destructive">
              {errors.passwordMatch}
            </CardDescription>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 animate-spin" />}
            {t('Sign Up')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default RegisterForm
