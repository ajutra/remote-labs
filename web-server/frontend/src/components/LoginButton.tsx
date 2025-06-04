import { CircleUserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { LoginForm } from '@/components/forms/LoginForm'
import { RegisterForm } from '@/components/forms/RegisterForm'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'

export function LoginButton() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const { isLoggedIn, logout } = useAuth()
  const { t } = useTranslation()

  const handleOpenRegister = () => {
    setLoginOpen(false)
    setRegisterOpen(true)
  }

  return (
    <>
      {isLoggedIn ? (
        <Button variant="outline" onClick={logout}>
          <CircleUserRound />
          <span>{t('Logout')}</span>
        </Button>
      ) : (
        <>
          <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CircleUserRound />
                <span>{t('Log In')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <VisuallyHidden.Root>
                <DialogTitle>{t('Log In')}</DialogTitle>
                <DialogDescription>
                  {t(
                    'Enter your username and password below to login to your account'
                  )}
                </DialogDescription>
              </VisuallyHidden.Root>
              <LoginForm
                onLogin={() => setLoginOpen(false)}
                onOpenRegister={handleOpenRegister}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
            <DialogContent>
              <VisuallyHidden.Root>
                <DialogTitle>{t('Sign Up')}</DialogTitle>
                <DialogDescription>
                  {t(
                    'Enter your username and password below to sign up for an account'
                  )}
                </DialogDescription>
              </VisuallyHidden.Root>
              <RegisterForm onRegister={() => setRegisterOpen(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}
