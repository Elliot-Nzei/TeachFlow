
'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsContext } from '@/contexts/settings-context';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { usePlan } from '@/contexts/plan-context';

export default function AdminDashboardPage() {
    const { settings, isLoading } = useContext(SettingsContext);
    const router = useRouter();

    if (isLoading) {
        return <div>Loading...</div>; // Or a skeleton loader
    }

    if (settings?.role !== 'admin') {
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
        <div>
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and platform settings.</p>
            {/* Admin content goes here */}
        </div>
    );
}

