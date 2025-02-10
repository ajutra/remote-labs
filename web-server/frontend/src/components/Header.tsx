import React from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import ModeToggle from '@/components/mode-toggle'

const Header: React.FC = () => {
  return (
    <header className="flex h-20 items-center justify-between bg-card p-4 text-card-foreground">
      <div className="flex h-full items-center">
        <img
          src="/src/assets/logo.png"
          alt="Logo"
          className="h-full max-h-full object-contain"
        />
      </div>
      <span className="absolute left-1/2 -translate-x-1/2 transform text-xl font-bold">
        Remote Labs
      </span>
      <div className="flex items-center space-x-4">
        <LanguageSelector />
        <ModeToggle />
      </div>
    </header>
  )
}

export default Header
