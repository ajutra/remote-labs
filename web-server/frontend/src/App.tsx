import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import '@/index.css'
import '@/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { AppRoutes } from '@/enums/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { AlertDialogProvider } from '@/context/AlertDialogContext'
import Subjects from './pages/Subjects'
import LoginPage from './pages/LoginPage'
import MyLabs from './pages/MyLabs'
import SubjectDetail from './pages/SubjectDetail'
import ControlPlane from './pages/ControlPlane'
import useIsAdmin from '@/hooks/useIsAdmin'
import VerifyEmail from './pages/VerifyEmail'
import { Layout } from '@/pages/Layout'
import UserSettings from './pages/UserSettings'

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAdmin = useIsAdmin()
  return isAdmin ? <>{children}</> : <Navigate to={AppRoutes.HOME} />
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <AlertDialogProvider>
            <Routes>
              <Route path={AppRoutes.LOGIN} element={<LoginPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path={AppRoutes.HOME} element={<Home />} />
                      <Route path={AppRoutes.SUBJECTS} element={<Subjects />} />
                      <Route
                        path={`${AppRoutes.SUBJECTS}/:id`}
                        element={<SubjectDetail />}
                      />
                      <Route path={AppRoutes.MYLABS} element={<MyLabs />} />
                      <Route
                        path={AppRoutes.USER_SETTINGS}
                        element={<UserSettings />}
                      />
                      <Route
                        path={AppRoutes.CONTROL_PLANE}
                        element={
                          <AdminRoute>
                            <ControlPlane />
                          </AdminRoute>
                        }
                      />
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
