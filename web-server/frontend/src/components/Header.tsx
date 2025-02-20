import React from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import ModeToggle from '@/components/mode-toggle'
import { LoginButton } from './LoginButton'

const Header: React.FC = () => {
  return (
    <header className="relative flex flex-wrap items-center justify-between space-y-3 bg-card p-4 text-card-foreground md:space-y-0">
      <div className="flex w-full justify-center md:w-auto md:justify-start">
        <img
          src="/src/assets/logo.png"
          alt="Logo"
          className="h-12 w-auto object-contain"
        />
      </div>
      <div className="order-1 flex w-full justify-center md:absolute md:left-1/2 md:order-1 md:w-auto md:-translate-x-1/2 md:transform">
        <span className="whitespace-nowrap text-2xl font-bold text-highlight">
          Remote Labs
        </span>
      </div>
      <div className="order-2 flex w-full justify-center space-x-4 md:order-2 md:w-auto md:flex-grow md:justify-end">
        <LanguageSelector />
        <ModeToggle />
        <LoginButton />
      </div>
    </header>
  )
}

export default Header
