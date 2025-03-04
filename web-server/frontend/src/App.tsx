import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import '@/index.css'
import '@/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { Layout } from '@/pages/Layout'
import { AppRoutes } from '@/enums/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { AlertDialogProvider } from '@/context/AlertDialogContext'
import Subjects from './pages/Subjects'
import LoginPage from './pages/LoginPage'
import MyLabs from './pages/MyLabs'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <AlertDialogProvider>
            <Routes>
              <Route path={AppRoutes.LOGIN} element={<LoginPage />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path={AppRoutes.HOME} element={<Home />} />
                      <Route path={AppRoutes.SUBJECTS} element={<Subjects />} />
                      <Route path={AppRoutes.MYLABS} element={<MyLabs />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </AlertDialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
