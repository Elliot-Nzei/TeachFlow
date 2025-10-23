
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useUser, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function AdminDashboardPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [greeting, setGreeting] = useState('');

    const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<any>(userProfileQuery);

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

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">
                {greeting && userProfile ? `${greeting}, ${userProfile.name.split(' ')[0]}!` : 'Admin Dashboard'}
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to the Admin Dashboard</CardTitle>
                    <CardDescription>
                        This area is for platform management. The dashboard content has been cleared.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This space is ready for new statistics and management tools.</p>
                </CardContent>
            </Card>
        </div>
    );
}
