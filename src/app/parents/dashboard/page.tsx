'use client';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import StudentProfileContent from '@/components/student-profile-content';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

type ParentProfile = {
    linkedStudentIds: string[];
}

export default function ParentDashboardPage() {
    const { firestore, auth, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const [studentIds, setStudentIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchParentProfile = async () => {
            if (user && firestore) {
                try {
                    const parentDocRef = doc(firestore, 'parents', user.uid);
                    const parentDocSnap = await getDoc(parentDocRef);
                    if (parentDocSnap.exists()) {
                        const parentData = parentDocSnap.data() as ParentProfile;
                        
                        if (parentData.linkedStudentIds && parentData.linkedStudentIds.length > 0) {
                            setStudentIds(parentData.linkedStudentIds);
                        } else {
                            setError("No children are linked to this account.");
                        }
                    } else {
                        // This case can happen if a user is authenticated but has no parent profile.
                        // We should probably guide them. For now, show an error.
                         const teacherDocRef = doc(firestore, 'users', user.uid);
                         const teacherDocSnap = await getDoc(teacherDocRef);
                         if (teacherDocSnap.exists()) {
                            setError("This appears to be a teacher account. Please log in through the teacher portal.");
                         } else {
                            setError("Parent profile not found. Please contact the school administrator.");
                         }
                    }
                } catch (e) {
                    setError("Failed to fetch your profile. Please try again later.");
                    console.error("Error fetching parent profile:", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (!isUserLoading) {
            if (user) {
                fetchParentProfile();
            } else {
                // If no user, redirect to login
                router.push('/parents/login');
            }
        }
    }, [user, isUserLoading, firestore, router]);

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/parents/login');
    };
    
    if (isLoading || isUserLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }
    
     if (error) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                           <AlertCircle className="h-6 w-6 text-destructive"/> Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{error}</p>
                        <Button onClick={handleLogout} className="mt-6">Logout</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
                <Logo />
                <nav className="ml-auto flex gap-2 sm:gap-4">
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
                </nav>
            </header>
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                {/* For now, we only show the first student. A selector could be added later for multiple children. */}
                {studentIds.length > 0 && <StudentProfileContent studentId={studentIds[0]} readOnly />}
            </main>
        </div>
    );
}
