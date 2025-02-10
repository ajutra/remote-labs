import React from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import ModeToggle from '@/components/mode-toggle'

const Header: React.FC = () => {
  return (
    <header className="flex flex-wrap items-center justify-between bg-card p-4 text-card-foreground">
      <div className="flex items-center">
        <img
          src="/src/assets/logo.png"
          alt="Logo"
          className="h-12 w-auto object-contain"
        />
      </div>
      <div className="order-2 flex flex-1 justify-center md:order-1">
        <span className="whitespace-nowrap text-xl font-bold">Remote Labs</span>
      </div>
      <div className="order-1 flex items-center space-x-4 md:order-2">
        <LanguageSelector />
        <ModeToggle />
      </div>
    </header>
  )
}

export default Header
