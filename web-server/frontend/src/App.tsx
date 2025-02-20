import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import '@/index.css'
import '@/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { Layout } from '@/pages/Layout'
import { AppRoutes } from '@/enums/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { AlertDialogProvider } from '@/context/AlertDialogContext'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <AlertDialogProvider>
            <Layout>
              <Routes>
                <Route path={AppRoutes.HOME} element={<Home />} />
              </Routes>
            </Layout>
          </AlertDialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
