
'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'stock' | 'transfer' | 'general' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: any;
};

const getIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case 'stock': return <Package className="h-5 w-5 text-orange-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
};

export default function NotificationsPage() {
    const { firestore, user } = useFirebase();

    const notificationsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')) : null,
        [firestore, user]
    );
    const { data: notifications, isLoading, error } = useCollection<Notification>(notificationsQuery);
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">All Notifications</h1>
                <p className="text-muted-foreground">A complete history of all system and user notifications.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Notification History</CardTitle>
                    <CardDescription>
                        {isLoading ? 'Loading notifications...' : `Showing all ${notifications?.length || 0} notifications.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}

                        {!isLoading && error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error Loading Notifications</AlertTitle>
                                <AlertDescription>{error.message}</AlertDescription>
                            </Alert>
                        )}

                        {!isLoading && notifications && notifications.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No notifications found.</p>
                            </div>
                        )}
                        
                        {!isLoading && notifications && notifications.map((notif) => (
                            <div key={notif.id} className={`p-4 rounded-lg border flex items-start gap-4 ${notif.isRead ? 'bg-background' : 'bg-muted'}`}>
                                <div className="mt-1">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{notif.title}</p>
                                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
