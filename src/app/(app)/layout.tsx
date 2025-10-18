'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRightLeft,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  User,
  Moon,
  Sun,
  Notebook,
  BookCopy,
  CalendarCheck,
  FileQuestion,
  DollarSign,
  Database,
  CalendarDays,
  CreditCard,
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
import NotificationBell from '@/components/notification-bell';
import PlanStatusBanner from '@/components/plan-status-banner';
import UpgradeModal from '@/components/upgrade-modal';


const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/classes', label: 'Classes', icon: Users },
  { href: '/students', label: 'Students', icon: User },
  { href: '/academics', label: 'Academics', icon: BookCopy },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/timetable', label: 'Timetable', icon: CalendarDays },
  { href: '/grades', label: 'Grades', icon: BookOpen },
  { href: '/payments', label: 'Payments', icon: DollarSign },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/reports', label: 'Report Cards', icon: ClipboardList },
  { href: '/lesson-generator', label: 'Lesson Generator', icon: Notebook },
  { href: '/exam-question-generator', label: 'Exam Generator', icon: FileQuestion },
  { href: '/transfer', label: 'Data Transfer', icon: ArrowRightLeft },
  { href: '/system', label: 'System', icon: Database },
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
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.userCode}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
               {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
               <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </DropdownMenuItem>
            <Link href="/settings">
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SettingsProvider>
      <PlanProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <Sidebar>
              <SidebarHeader>
                <Logo />
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href}>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
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
                        <Link href="/settings">
                            <SidebarMenuButton isActive={pathname === '/settings'} tooltip={{children: 'Settings'}}>
                                <Settings />
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
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
                    <div className="ml-auto flex items-center gap-2">
                        <NotificationBell />
                        <UserProfileDisplay />
                    </div>
                </div>
              </header>
              <PlanStatusBanner />
              <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {children}
              </main>
              <UpgradeModal />
            </div>
          </div>
        </SidebarProvider>
      </PlanProvider>
    </SettingsProvider>
  );
}
