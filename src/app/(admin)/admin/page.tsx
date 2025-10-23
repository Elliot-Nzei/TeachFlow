
'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users, ClipboardList, GraduationCap, DollarSign, Lock, Building } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Button } from '@/components/ui/button';

const StatCard = ({ title, value, icon, isLoading }: { title: string; value: string | number; icon: React.ReactNode; isLoading?: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-8 w-1/2 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const router = useRouter();

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'teacher')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

    const classesQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'classes') : null, [firestore]);
    const { data: classes, isLoading: isLoadingClasses } = useCollection(classesQuery);
    
    const studentsQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'students') : null, [firestore]);
    const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);

    const userProfileQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useCollection(userProfileQuery);

    const isLoading = isLoadingUsers || isLoadingClasses || isLoadingStudents || isUserLoading || isLoadingProfile;
    
    const planCounts = useMemo(() => {
        if (!users) return { free_trial: 0, basic: 0, prime: 0 };
        return users.reduce((acc, user) => {
            const plan = user.plan || 'free_trial';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [users]);

    const chartData = [
        { plan: 'Free', users: planCounts.free_trial || 0, fill: 'var(--color-free)' },
        { plan: 'Basic', users: planCounts.basic || 0, fill: 'var(--color-basic)' },
        { plan: 'Prime', users: planCounts.prime || 0, fill: 'var(--color-prime)' },
    ];
    
    const chartConfig = {
        users: { label: 'Users' },
        free: { label: 'Free', color: 'hsl(var(--chart-1))' },
        basic: { label: 'Basic', color: 'hsl(var(--chart-2))' },
        prime: { label: 'Prime', color: 'hsl(var(--chart-4))' },
    } satisfies ChartConfig;

    if (!isLoading && userProfile && userProfile[0]?.role !== 'admin') {
         return (
             <div className="flex items-center justify-center h-full">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2"><Lock className="h-5 w-5" /> Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>This dashboard is for platform administrators only.</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">Return to Dashboard</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={users?.length || 0} icon={<Users className="text-muted-foreground" />} isLoading={isLoadingUsers} />
                <StatCard title="Total Classes" value={classes?.length || 0} icon={<Building className="text-muted-foreground" />} isLoading={isLoadingClasses} />
                <StatCard title="Total Students" value={students?.length || 0} icon={<GraduationCap className="text-muted-foreground" />} isLoading={isLoadingStudents} />
                <StatCard title="Total Revenue" value="₦0" icon={<DollarSign className="text-muted-foreground" />} isLoading={false} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Subscription Plans</CardTitle>
                    <CardDescription>Distribution of users across different subscription plans.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[250px] w-full" /> :
                        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="plan" tickLine={false} tickMargin={10} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="users" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    }
                </CardContent>
            </Card>
        </div>
    );
}
