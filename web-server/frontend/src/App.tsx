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
import { LoadingProvider } from '@/context/LoadingContext'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import RenewSession from './pages/RenewSession'
import Tutorials from './pages/Tutorials'
import AboutUs from './pages/AboutUs'

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
            <LoadingProvider>
              <Routes>
                <Route path={AppRoutes.LOGIN} element={<LoginPage />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path={AppRoutes.RESET_PASSWORD} element={<ResetPassword />} />
                <Route path="/renew-session" element={<RenewSession />} />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path={AppRoutes.HOME} element={<Home />} />
                          <Route
                            path={AppRoutes.SUBJECTS}
                            element={<Subjects />}
                          />
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
                          <Route
                            path={AppRoutes.TUTORIALS}
                            element={<Tutorials />}
                          />
                          <Route
                            path={AppRoutes.ABOUT_US}
                            element={<AboutUs />}
                          />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </LoadingProvider>
          </AlertDialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
