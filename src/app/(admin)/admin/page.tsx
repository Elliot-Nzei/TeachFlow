
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, collectionGroup } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ClipboardList, DollarSign } from 'lucide-react';

const plansData = {
  basic: { monthly: 1500, annually: 15000 },
  prime: { monthly: 3500, annually: 35000 },
  free_trial: { monthly: 0, annually: 0 },
};

const StatCard = ({ title, value, icon, description, isLoading }: { title: string; value: string; icon: React.ReactNode, description?: string, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-3/4" />
      ) : (
        <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [greeting, setGreeting] = useState('');

    const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userProfileQuery);

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const { data: allUsers, isLoading: isLoadingUsers } = useCollection<any>(usersQuery);

    const classesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'classes')) : null, [firestore]);
    const { data: allClasses, isLoading: isLoadingClasses } = useCollection<any>(classesQuery);

    const totalRevenue = useMemo(() => {
        if (!allUsers) return 0;

        return allUsers.reduce((total, u) => {
            const plan = u.plan as keyof typeof plansData;
            const cycle = u.subscriptionCycle as 'monthly' | 'annually';
            if (plan && cycle && plansData[plan]) {
                return total + (plansData[plan][cycle] || 0);
            }
            return total;
        }, 0);
    }, [allUsers]);

    useEffect(() => {
        const now = new Date();
        const hour = now.getHours();
        if (hour < 12) {
            setGreeting('Good morning');
        } else if (hour < 18) {
            setGreeting('Good afternoon');
        } else {
            setGreeting('Good evening');
        }
    }, []);

    const isLoading = isLoadingUsers || isLoadingClasses;

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">
                {greeting && userProfile ? `${greeting}, ${userProfile.name.split(' ')[0]}!` : 'Admin Dashboard'}
            </h1>
            <p className="text-muted-foreground">Platform overview and statistics.</p>

             <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Total Users" 
                    value={allUsers?.length?.toString() || '0'} 
                    icon={<Users className="h-4 w-4 text-muted-foreground" />} 
                    isLoading={isLoading} 
                />
                <StatCard 
                    title="Total Classes" 
                    value={allClasses?.length?.toString() || '0'} 
                    icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} 
                    isLoading={isLoading} 
                />
                <StatCard 
                    title="Estimated Monthly Revenue" 
                    value={`₦${totalRevenue.toLocaleString()}`}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
                    description="Based on current subscriptions"
                    isLoading={isLoading} 
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Welcome</CardTitle>
                    <CardDescription>
                        This admin dashboard is ready for more tools and analytics.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>You can manage users, marketplace content, and platform settings from the sidebar.</p>
                </CardContent>
            </Card>
        </div>
    );
}
