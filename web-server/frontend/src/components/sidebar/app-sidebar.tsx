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
import { Home, Book, Laptop, Settings, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppRoutes } from '@/enums/AppRoutes'
import useIsAdmin from '@/hooks/useIsAdmin'
import { NavUser } from './nav-user'

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
  {
    title: 'Tutorials',
    url: AppRoutes.TUTORIALS,
    icon: Video,
  },
]

export function AppSidebar() {
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
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
