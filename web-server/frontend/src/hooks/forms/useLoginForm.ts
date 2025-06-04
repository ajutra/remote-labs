import { useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

export const useLoginForm = (onLogin: () => void) => {
  const { t } = useTranslation()
  const { login, isLoading } = useAuth()
  const { toast } = useToast()
  const emailRef = useRef<HTMLInputElement>(null)
  const pwdRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (emailRef.current && pwdRef.current) {
      const result = await login(emailRef.current.value, pwdRef.current.value)
      if (result.error) {
        setError(result.error)
      } else {
        toast({
          description: t('You have been logged in successfully'),
        })
        onLogin()
      }
    }
  }

  return {
    emailRef,
    pwdRef,
    error,
    isLoading,
    handleSubmit,
  }
}
