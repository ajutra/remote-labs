import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Home, Book, LogOut, Laptop, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppRoutes } from '@/enums/AppRoutes'
import { useAuth } from '@/context/AuthContext'
import useIsAdmin from '@/hooks/useIsAdmin'

const items = [
  {
    title: 'Home',
    url: AppRoutes.HOME,
    icon: Home,
  },
  {
    title: 'Subjects',
    url: AppRoutes.SUBJECTS,
    icon: Book,
  },
  {
    title: 'MyLabs',
    url: AppRoutes.MYLABS,
    icon: Laptop,
  },
]

export function AppSidebar() {
  const { logout } = useAuth()
  const isAdmin = useIsAdmin()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>RemoteLabs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to={AppRoutes.CONTROL_PLANE}>
                      <Settings />
                      <span>Control Plane</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
