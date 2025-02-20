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
import { useTranslation } from 'react-i18next'
import { useAlertDialog } from '@/context/AlertDialogContext'

export function RegisterForm({ onRegister }: { onRegister: () => void }) {
  const { t } = useTranslation()
  const { register } = useAuth()
  const { showAlert } = useAlertDialog()
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const pwdRef = useRef<HTMLInputElement>(null)
  const pwdCheckRef = useRef<HTMLInputElement>(null)

  // Estado para almacenar múltiples errores
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    passwordMatch?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Limpiar errores previos
    setErrors({})

    const newErrors: {
      email?: string
      password?: string
      passwordMatch?: string
    } = {}

    // Expresión regular para validar que el correo sea cualquiercosa@edu.tecnocampus.cat
    const emailPattern = /^[^@\s]+@edu\.tecnocampus\.cat$/
    if (emailRef.current && !emailPattern.test(emailRef.current.value)) {
      newErrors.email = t(
        'Invalid email address, must be student email like: user@edu.tecnocampus.cat'
      )
    }

    if (pwdRef.current && pwdRef.current.value.length < 6) {
      newErrors.password = t('Password must be at least 6 characters')
    }

    if (
      pwdRef.current &&
      pwdCheckRef.current &&
      pwdRef.current.value !== pwdCheckRef.current.value
    ) {
      newErrors.passwordMatch = t('Passwords do not match')
    }

    // Si hay algún error, se actualiza el estado y se detiene el envío
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Si todas las validaciones pasan, se procede a registrar al usuario
    if (nameRef.current && emailRef.current && pwdRef.current) {
      setIsLoading(true)
      const result = await register(
        nameRef.current.value,
        emailRef.current.value,
        pwdRef.current.value
      )
      setIsLoading(false)
      if (result.error) {
        // Aquí podrías asignar el error a uno de los campos o mostrar un mensaje general
        setErrors({ email: result.error })
      } else {
        showAlert(
          t('Registration successful'),
          t(
            'A verification email has been sent to your email address. Please verify your account before logging in.'
          )
        )
        onRegister()
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
