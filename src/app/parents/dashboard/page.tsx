
'use client';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, arrayUnion } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import StudentProfileContent from '@/components/student-profile-content';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Link2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type ParentProfile = {
    linkedStudentIds: string[];
}

export default function ParentDashboardPage() {
    const { firestore, auth, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();

    const [studentIds, setStudentIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parentIdInput, setParentIdInput] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    const fetchParentProfile = async () => {
        if (user && firestore) {
            try {
                setIsLoading(true);
                const parentDocRef = doc(firestore, 'parents', user.uid);
                const parentDocSnap = await getDoc(parentDocRef);
                if (parentDocSnap.exists()) {
                    const parentData = parentDocSnap.data() as ParentProfile;
                    
                    if (parentData.linkedStudentIds && parentData.linkedStudentIds.length > 0) {
                        setStudentIds(parentData.linkedStudentIds);
                    } else {
                        // No children linked, stay on this page to show the linking form.
                        setStudentIds([]);
                    }
                } else {
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

    useEffect(() => {
        if (!isUserLoading) {
            if (user) {
                fetchParentProfile();
            } else {
                router.push('/parents/login');
            }
        }
    }, [user, isUserLoading, firestore, router]);

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/parents/login');
    };

    const handleLinkChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !parentIdInput) return;

        setIsLinking(true);
        try {
            const studentQuery = query(collectionGroup(firestore, 'students'), where('parentId', '==', parentIdInput));
            const studentSnapshot = await getDocs(studentQuery);

            if (studentSnapshot.empty) {
                throw new Error("Invalid Parent ID. Please check the ID provided by the school and try again.");
            }

            const studentDoc = studentSnapshot.docs[0];
            const parentDocRef = doc(firestore, 'parents', user.uid);

            await updateDoc(parentDocRef, {
                linkedStudentIds: arrayUnion(studentDoc.id),
                linkedParentIds: arrayUnion(parentIdInput),
            });

            toast({
                title: "Child Linked Successfully!",
                description: "You can now view your child's records.",
            });

            // Re-fetch profile to update the dashboard
            await fetchParentProfile();

        } catch (error) {
            console.error("Error linking child:", error);
            toast({
                variant: 'destructive',
                title: 'Linking Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        } finally {
            setIsLinking(false);
        }
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
                {studentIds.length > 0 ? (
                    <StudentProfileContent studentId={studentIds[0]} readOnly />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="h-5 w-5" />
                                    Link Your Child's Account
                                </CardTitle>
                                <CardDescription>
                                    Enter the unique Parent ID provided by your child's school to access their academic records.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLinkChild} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="parentIdInput">Child's Parent ID</Label>
                                        <Input
                                            id="parentIdInput"
                                            placeholder="PARENT-XXXX-YYYY"
                                            value={parentIdInput}
                                            onChange={e => setParentIdInput(e.target.value.toUpperCase())}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLinking}>
                                        {isLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {isLinking ? 'Linking...' : 'Link Child'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
