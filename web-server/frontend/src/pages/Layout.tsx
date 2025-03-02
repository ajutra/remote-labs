import { Toaster } from '@/components/ui/toaster'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import LanguageSelector from '@/components/LanguageSelector'
import ModeToggle from '@/components/mode-toggle'
import '@/index.css'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Current Page</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
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
