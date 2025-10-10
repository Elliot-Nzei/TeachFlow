
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function NotificationBell() {
  const { firestore, user } = useFirebase();

  const pendingTransfersQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'incomingTransfers'),
            where('status', '==', 'pending')
          )
        : null,
    [firestore, user]
  );

  const { data: pendingTransfers, isLoading } = useCollection(pendingTransfersQuery);

  const pendingCount = pendingTransfers?.length || 0;

  return (
    <Link href="/transfer" passHref>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {pendingCount}
          </span>
        )}
        <span className="sr-only">View Notifications</span>
      </Button>
    </Link>
  );
}
