import { Toaster } from '@/components/ui/toaster'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import LanguageSelector from '@/components/LanguageSelector'
import ModeToggle from '@/components/mode-toggle'
import { useLocation } from 'react-router-dom'
import { AppRoutes } from '@/enums/AppRoutes'
import '@/index.css'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case AppRoutes.HOME:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.HOME}>Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case AppRoutes.SUBJECTS:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.SUBJECTS}>
                Subjects
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case AppRoutes.MYLABS:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.MYLABS}>
                My Labs
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case AppRoutes.TUTORIALS:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.TUTORIALS}>
                Tutorials
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case AppRoutes.ABOUT_US:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.ABOUT_US}>
                About Us
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case AppRoutes.CONTROL_PLANE:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.CONTROL_PLANE}>
                Control Panel
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      case AppRoutes.USER_SETTINGS:
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={AppRoutes.USER_SETTINGS}>
                User Settings
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex w-full flex-1">
          <AppSidebar />
          <div className="w-full flex-1 p-4">
            <header className="flex w-full flex-col gap-2">
              <div className="bg-sidebar-background dark:bg-sidebar-background flex w-full flex-wrap items-center justify-between p-4">
                <div className="text-primary">
                  <h1 className="text-3xl font-bold">RemoteLabs</h1>
                </div>
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  <ModeToggle />
                </div>
              </div>
              <div className="flex h-16 w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>{getBreadcrumb()}</Breadcrumb>
                </div>
              </div>
            </header>
            <main className="flex w-full flex-grow flex-col">{children}</main>
            <Toaster />
          </div>
        </div>
        <ScrollToTopButton />
      </div>
    </SidebarProvider>
  )
}

export { Layout }
