'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">
                Admin Dashboard
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Welcome</CardTitle>
                    <CardDescription>
                        This is the admin dashboard. The previous content has been removed as requested.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This area is ready for new content.</p>
                </CardContent>
            </Card>
        </div>
    );
}
