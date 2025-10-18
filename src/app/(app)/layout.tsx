
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRightLeft,
  BookCopy,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  User,
  Moon,
  Sun,
  Notebook,
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
import { PlanProvider, usePlan } from '@/contexts/plan-context';
import NotificationBell from '@/components/notification-bell';
import UpgradeModal from '@/components/upgrade-modal';
import { Badge } from '@/components/ui/badge';
import { toTitleCase } from '@/lib/utils';


const allMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/classes', label: 'Classes', icon: Users, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/students', label: 'Students', icon: User, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/academics', label: 'Academics', icon: BookCopy, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/timetable', label: 'Timetable', icon: CalendarDays, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/grades', label: 'Grades', icon: Notebook, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/payments', label: 'Payments', icon: DollarSign, plans: ['free_trial', 'basic', 'prime'] },
  { href: '/reports', label: 'Report Cards', icon: ClipboardList, plans: ['basic', 'prime'] },
  { href: '/lesson-generator', label: 'Lesson Generator', icon: Notebook, plans: ['basic', 'prime'] },
  { href: '/exam-question-generator', label: 'Exam Generator', icon: FileQuestion, plans: ['basic', 'prime'] },
  { href: '/transfer', label: 'Data Transfer', icon: ArrowRightLeft, plans: ['prime'] },
  { href: '/system', label: 'System', icon: Database, plans: ['prime'] },
  { href: '/billing', label: 'Billing', icon: CreditCard, plans: ['free_trial', 'basic', 'prime'] },
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

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan, isTrial, trialTimeRemaining, isLocked } = usePlan();

  const menuItems = allMenuItems.filter(item => plan && item.plans.includes(plan));

  const formatTime = (seconds: number) => {
    const clampedSeconds = Math.max(0, seconds);
    const minutes = Math.floor(clampedSeconds / 60);
    const remainingSeconds = clampedSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };


  return (
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
                  <Link href={item.href} aria-disabled={isLocked && item.href !== '/billing'} onClick={(e) => (isLocked && item.href !== '/billing') && e.preventDefault()}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                      tooltip={{ children: item.label }}
                      disabled={isLocked && item.href !== '/billing'}
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
                    <Link href="/settings" aria-disabled={isLocked} onClick={(e) => isLocked && e.preventDefault()}>
                        <SidebarMenuButton isActive={pathname === '/settings'} tooltip={{children: 'Settings'}} disabled={isLocked}>
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
                <div className="ml-auto flex items-center gap-4">
                    {plan && (
                       <Badge variant={isTrial ? 'destructive' : 'outline'}>
                         {isTrial ? `Trial: ${formatTime(trialTimeRemaining)}` : toTitleCase(plan.replace('_', ' '))}
                       </Badge>
                    )}
                    <NotificationBell />
                    <UserProfileDisplay />
                </div>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
          </main>
          <UpgradeModal />
        </div>
      </div>
    </SidebarProvider>
  )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <PlanProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </PlanProvider>
    </SettingsProvider>
  );
}
