import React, { useRef, useState } from 'react'
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
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

export function RegisterForm({ onRegister }: { onRegister: () => void }) {
  const { t } = useTranslation()
  const { register } = useAuth()
  const { toast } = useToast()
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const pwdRef = useRef<HTMLInputElement>(null)
  const pwdCheckRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (pwdRef.current && pwdCheckRef.current) {
      if (pwdRef.current.value !== pwdCheckRef.current.value) {
        setError(t('Passwords do not match'))
      } else if (nameRef.current && emailRef.current && pwdRef.current) {
        setIsLoading(true)
        const result = await register(
          nameRef.current.value,
          emailRef.current.value,
          pwdRef.current.value
        )
        setIsLoading(false)
        if (result.error) {
          setError(result.error)
        } else {
          toast({
            description: t(
              'A verification email has been sent to your email address. Please verify your account before logging in.'
            ),
          })
          onRegister()
        }
      }
    }
  }

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
        <form onSubmit={handleSubmit} className="grid gap-4">
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
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
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
          {error && (
            <CardDescription className="text-destructive">
              {error}
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
