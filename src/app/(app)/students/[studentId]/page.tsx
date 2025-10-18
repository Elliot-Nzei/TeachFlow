
'use client';
import React, { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import StudentProfileContent from '@/components/student-profile-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDetailsPage({ params }: { params: { studentId: string } }) {
  const { studentId } = params;
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  // Show a loading state while the user's authentication status is being determined.
  // This prevents race conditions where the query is created with a null user ID.
  if (isUserLoading || !user || !firestore) {
    return (
      <div className="space-y-8 p-4 md:p-6">
          <Skeleton className="h-32 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
      </div>
    );
  }

  // If we have a user, we can now safely render the component that fetches data.
  // We pass the studentId as a prop.
  return <StudentProfileContent studentId={studentId} />;
}
