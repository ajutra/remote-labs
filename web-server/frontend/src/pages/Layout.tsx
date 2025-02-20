import Header from '@/components/Header'
import { Toaster } from '@/components/ui/toaster'
import ScrollToTopButton from '@/components/ScrollToTopButton'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <Header />
      <div className="pt-24">
        <main>{children}</main>
        <Toaster />
      </div>
      <ScrollToTopButton />
    </div>
  )
}

export { Layout }
