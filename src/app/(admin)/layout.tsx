
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  Users,
  Moon,
  Sun,
  Shield,
  ShoppingCart,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from "next-themes"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsProvider } from '@/contexts/settings-context';
import { PlanProvider } from '@/contexts/plan-context';

const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/marketplace', label: 'Marketplace', icon: ShoppingCart },
];

function UserProfileDisplay() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  
  const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileQuery);
  const { setTheme, theme } = useTheme();

  if (isUserLoading || isProfileLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user || !userProfile) {
    return (
      <Link href="/login">
        <Button variant="outline">Login</Button>
      </Link>
    )
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile?.profilePicture} alt={userProfile?.name} />
                    <AvatarFallback>{userProfile?.name?.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
               {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
               <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </DropdownMenuItem>
            <Link href="/dashboard">
                <DropdownMenuItem>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Go to App</span>
                </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link href="/">
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </Link>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <Logo compact={sidebarState === 'collapsed'} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {adminMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
              <SidebarMenuItem>
                  <Link href="/">
                      <SidebarMenuButton tooltip={{children: 'Logout'}}>
                          <LogOut />
                          <span>Logout</span>
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
              <div className="ml-auto flex items-center gap-4">
                  <UserProfileDisplay />
              </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <PlanProvider>
        <SidebarProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </SidebarProvider>
      </PlanProvider>
    </SettingsProvider>
  );
}
