
'use client';

import { useState } from 'react';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, ShoppingCart, Package, AlertCircle, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteNotification, clearAllNotifications } from './actions';
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [dialogState, setDialogState] = useState<{ open: boolean; item?: Notification | 'all' }>({ open: false });

    const notificationsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')) : null,
        [firestore, user]
    );
    const { data: notifications, isLoading, error } = useCollection<Notification>(notificationsQuery);
    
    const handleDelete = async () => {
        if (!user || !dialogState.item) return;

        if (dialogState.item === 'all') {
            setIsClearing(true);
            const result = await clearAllNotifications(user.uid);
            if (result.success) {
                toast({ title: 'Success', description: 'All notifications have been cleared.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
            setIsClearing(false);
        } else {
            const notif = dialogState.item as Notification;
            setIsDeleting(notif.id);
            const result = await deleteNotification(user.uid, notif.id);
            if (result.success) {
                toast({ title: 'Success', description: 'Notification deleted.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
            setIsDeleting(null);
        }
        setDialogState({ open: false });
    };

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">All Notifications</h1>
                    <p className="text-muted-foreground">A complete history of all system and user notifications.</p>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Notification History</CardTitle>
                            <CardDescription>
                                {isLoading ? 'Loading notifications...' : `Showing all ${notifications?.length || 0} notifications.`}
                            </CardDescription>
                        </div>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setDialogState({ open: true, item: 'all' })}
                            disabled={isClearing || !notifications || notifications.length === 0}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Clear All
                        </Button>
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
                                    <div className="flex flex-col items-end gap-1 text-right">
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDialogState({ open: true, item: notif })}
                                            disabled={!!isDeleting}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={dialogState.open} onOpenChange={(open) => !open && setDialogState({ open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogState.item === 'all'
                                ? "This will permanently delete all notifications. This action cannot be undone."
                                : "This will permanently delete this notification. This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
