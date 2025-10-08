
'use client';
import React, { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import StudentProfileContent from '@/components/student-profile-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDetailsPage({ params }: { params: { studentId: string } }) {
  const { studentId } = React.use(params);
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  // Show a loading state while the user's authentication status is being determined.
  // This prevents race conditions where the query is created with a null user ID.
  if (isUserLoading || !user || !firestore) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // If we have a user, we can now safely render the component that fetches data.
  // We pass the studentId as a prop.
  return <StudentProfileContent studentId={studentId} />;
}
