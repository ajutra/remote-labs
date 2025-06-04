import React from 'react'
import { LoginButton } from '@/components/LoginButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import LanguageSelector from '@/components/LanguageSelector'
import ModeToggle from '@/components/mode-toggle'
import image from '@/assets/image.png'
import logo from '@/assets/logo.png'

const LoginPage: React.FC = () => {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0 bg-black opacity-50"
        style={{ backdropFilter: 'blur(8px)' }}
      ></div>
      <div className="absolute left-4 top-4">
        <img src={logo} alt="Logo" className="h-12 sm:h-16" />
      </div>
      <div className="absolute right-4 top-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <LanguageSelector />
        <ModeToggle />
      </div>
      <div className="relative z-10 mt-16 w-full max-w-lg sm:mt-0">
        <Card className="bg-card p-8 text-card-foreground">
          <CardHeader>
            <CardTitle className="mb-4 text-center text-3xl font-bold text-primary">
              Welcome to RemoteLabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <LoginButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
