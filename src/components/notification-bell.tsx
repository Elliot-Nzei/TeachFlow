
'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Bell, UserPlus, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTransfer, Student } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

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
  const { data: pendingTransfers, isLoading: isLoadingTransfers } = useCollection<DataTransfer>(pendingTransfersQuery);

  const unassignedStudentsQuery = useMemoFirebase(
    () => 
      user
        ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', ''))
        : null,
    [firestore, user]
  );
  const { data: unassignedStudents, isLoading: isLoadingStudents } = useCollection<Student>(unassignedStudentsQuery);


  const pendingTransferCount = pendingTransfers?.length || 0;
  const unassignedStudentCount = unassignedStudents?.length || 0;
  const totalNotificationCount = pendingTransferCount + unassignedStudentCount;

  const isLoading = isLoadingTransfers || isLoadingStudents;

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalNotificationCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {totalNotificationCount}
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
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : totalNotificationCount === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4">
                    You have no new notifications.
                </div>
            ) : (
                <>
                    {pendingTransfers && pendingTransfers.length > 0 && (
                        <>
                            {pendingTransfers.map((transfer) => (
                                <Link href="/transfer" key={transfer.id}>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <ArrowDownLeft className="mr-2 h-4 w-4 text-primary" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Incoming Transfer</p>
                                            <p className="text-xs text-muted-foreground">From: {transfer.fromUserCode}</p>
                                        </div>
                                    </DropdownMenuItem>
                                </Link>
                            ))}
                        </>
                    )}

                    {unassignedStudents && unassignedStudents.length > 0 && (
                        <>
                            {unassignedStudents.map((student) => (
                                <Link href="/students" key={student.id}>
                                     <DropdownMenuItem className="cursor-pointer">
                                        <UserPlus className="mr-2 h-4 w-4 text-primary" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Unassigned Student</p>
                                            <p className="text-xs text-muted-foreground">{student.name}</p>
                                        </div>
                                    </DropdownMenuItem>
                                </Link>
                            ))}
                        </>
                    )}
                </>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
