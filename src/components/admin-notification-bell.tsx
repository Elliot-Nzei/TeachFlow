
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Bell, ShoppingCart, Package, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'stock' | 'transfer' | 'general';
  isRead: boolean;
  link?: string;
  createdAt: any; 
};

export default function AdminNotificationBell() {
  const { firestore, user } = useFirebase();

  const notificationsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        : null,
    [firestore, user]
  );
  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  
  const unreadNotifications = useMemo(() => {
    return notifications?.filter(n => !n.isRead) || [];
  }, [notifications]);

  const handleMarkAsRead = (notificationId: string) => {
    if (!user) return;
    const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
    updateDocumentNonBlocking(notifRef, { isRead: true });
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ShoppingCart className="mr-2 h-4 w-4 text-green-500" />;
      case 'stock': return <Package className="mr-2 h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />;
    }
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {unreadNotifications.length}
                </span>
                )}
                <span className="sr-only">View Notifications</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {isLoading ? (
                <div className="p-2 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : !notifications || notifications.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4">
                    You have no new notifications.
                </div>
            ) : (
                <ScrollArea className="h-[300px]">
                    {notifications.map((notif) => (
                        <DropdownMenuItem key={notif.id} className="cursor-pointer items-start p-2" onSelect={(e) => {
                             e.preventDefault();
                             handleMarkAsRead(notif.id);
                        }}>
                             {!notif.isRead && (
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                             )}
                            <div className="flex items-start gap-2 pl-3">
                                {getIcon(notif.type)}
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{notif.title}</p>
                                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notif.id);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </ScrollArea>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}

    