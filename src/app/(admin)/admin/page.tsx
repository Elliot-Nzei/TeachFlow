
'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users, Building, GraduationCap, DollarSign, Lock } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Button } from '@/components/ui/button';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useIsMobile } from '@/hooks/use-mobile';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  isLoading?: boolean 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-4 w-4 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const isMobile = useIsMobile();

    // Get user profile to check admin role
    const userProfileQuery = useMemoFirebase(
      () => user ? doc(firestore, 'users', user.uid) : null, 
      [firestore, user]
    );
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<any>(userProfileQuery);

    // Get all users (not just teachers - removed the where clause)
    const usersQuery = useMemoFirebase(
      () => (firestore && userProfile?.role === 'admin') 
        ? collection(firestore, 'users') 
        : null, 
      [firestore, userProfile]
    );
    const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

    // Get all classes across all users
    const classesQuery = useMemoFirebase(
      () => (firestore && userProfile?.role === 'admin') 
        ? collectionGroup(firestore, 'classes') 
        : null, 
      [firestore, userProfile]
    );
    const { data: classes, isLoading: isLoadingClasses } = useCollection(classesQuery);

    // Get all students across all users
    const studentsQuery = useMemoFirebase(
      () => (firestore && userProfile?.role === 'admin') 
        ? collectionGroup(firestore, 'students') 
        : null, 
      [firestore, userProfile]
    );
    const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);

    const isLoading = isUserLoading || isLoadingProfile;
    const isDataLoading = isLoadingUsers || isLoadingClasses || isLoadingStudents;
    
    // Calculate plan distribution
    const planCounts = useMemo(() => {
        if (!users) return { free_trial: 0, basic: 0, prime: 0 };
        return users.reduce((acc, user) => {
            const plan = user.plan || 'free_trial';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
        }, { free_trial: 0, basic: 0, prime: 0 } as Record<string, number>);
    }, [users]);

    const chartData = [
        { plan: 'Free Trial', users: planCounts.free_trial || 0, fill: 'var(--color-free)' },
        { plan: 'Basic', users: planCounts.basic || 0, fill: 'var(--color-basic)' },
        { plan: 'Prime', users: planCounts.prime || 0, fill: 'var(--color-prime)' },
    ];
    
    const chartConfig = {
        users: { label: 'Users' },
        free: { label: 'Free Trial', color: 'hsl(var(--chart-1))' },
        basic: { label: 'Basic', color: 'hsl(var(--chart-2))' },
        prime: { label: 'Prime', color: 'hsl(var(--chart-4))' },
    } satisfies ChartConfig;

    // Loading state for initial page load
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-64" />
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    // Access denied for non-admins
    if (userProfile?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Lock className="h-5 w-5" /> 
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You do not have permission to view this page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            This dashboard is for platform administrators only.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            onClick={() => router.push('/dashboard')} 
                            className="w-full"
                        >
                            Return to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">
                    Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Platform overview and statistics
                </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Users" 
                    value={users?.length || 0} 
                    icon={<Users className="h-4 w-4" />} 
                    isLoading={isDataLoading} 
                />
                <StatCard 
                    title="Total Classes" 
                    value={classes?.length || 0} 
                    icon={<Building className="h-4 w-4" />} 
                    isLoading={isDataLoading} 
                />
                <StatCard 
                    title="Total Students" 
                    value={students?.length || 0} 
                    icon={<GraduationCap className="h-4 w-4" />} 
                    isLoading={isDataLoading} 
                />
                <StatCard 
                    title="Total Revenue" 
                    value="₦0" 
                    icon={<DollarSign className="h-4 w-4" />} 
                    isLoading={false} 
                />
            </div>

            {/* Chart Card */}
            <Card>
                <CardHeader>
                    <CardTitle>User Subscription Plans</CardTitle>
                    <CardDescription>
                        Distribution of users across different subscription plans.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isDataLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <div className="h-[300px] w-full">
                            <div className="md:hidden">
                                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <YAxis dataKey="plan" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={80} />
                                            <XAxis type="number" hide />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Bar dataKey="users" radius={[0, 4, 4, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                            <div className="hidden md:block">
                                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="plan" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                            <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
