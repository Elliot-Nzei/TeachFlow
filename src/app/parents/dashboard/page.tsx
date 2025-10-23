
'use client';
import { useFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, arrayUnion, collectionGroup } from 'firebase/firestore';
import { useEffect, useState, useMemo, useCallback } from 'react';
import ParentStudentProfile from '@/components/parent-student-profile';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { signOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Link2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getStudentByParentId } from '@/app/actions/parent-access';

type ParentProfile = {
    linkedStudentIds: string[];
    linkedParentIds?: string[];
}

export default function ParentDashboardPage() {
    const { firestore, auth, user, isUserLoading } = useFirebase();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [studentData, setStudentData] = useState<any | null>(null);
    const [linkedParentIds, setLinkedParentIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parentIdInput, setParentIdInput] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    const hasLinkedChildren = useMemo(() => linkedParentIds.length > 0, [linkedParentIds]);

    const fetchParentProfileAndStudentData = useCallback(async () => {
        if (!user || !firestore) return;
        setIsLoading(true);
        setError(null);
        setStudentData(null);
        
        try {
            // Use the user's UID to query their profile in the 'parents' collection
            const parentDocRef = doc(firestore, 'parents', user.uid);
            const parentDocSnap = await getDoc(parentDocRef);
    
            if (!parentDocSnap.exists()) {
                // This could happen if the doc creation failed or was delayed
                setError("Your parent profile could not be found. Please try logging out and in again, or contact support if the issue persists.");
                setIsLoading(false);
                return;
            }
            
            const parentData = parentDocSnap.data() as ParentProfile;
            const currentLinkedIds = parentData.linkedParentIds || [];
            setLinkedParentIds(currentLinkedIds);

            if (currentLinkedIds.length > 0) {
                // Fetch the first student's data
                const result = await getStudentByParentId(currentLinkedIds[0]);
                if (result.error) {
                    setError(result.error);
                } else {
                    setStudentData(result.data);
                }
            }

        } catch (e) {
            setError("Failed to fetch your profile. Please try again later.");
            console.error("Error fetching parent profile:", e);
        } finally {
            setIsLoading(false);
        }
    }, [user, firestore]);
    
    useEffect(() => {
        if (!isUserLoading) {
            if (user) {
                fetchParentProfileAndStudentData();
            } else {
                router.push('/parents/login');
            }
        }
    }, [user, isUserLoading, fetchParentProfileAndStudentData, router]);


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
            const studentQuery = query(collectionGroup(firestore, 'students'), where('parentId', '==', parentIdInput), limit(1));
            const studentSnapshot = await getDocs(studentQuery);

            if (studentSnapshot.empty) {
                throw new Error("Invalid Parent ID. Please check the ID provided by the school and try again.");
            }
            const studentDoc = studentSnapshot.docs[0];
            const parentDocRef = doc(firestore, 'parents', user.uid);

            await updateDoc(parentDocRef, {
                linkedParentIds: arrayUnion(parentIdInput),
                linkedStudentIds: arrayUnion(studentDoc.id),
            });

            toast({
                title: "Child Linked Successfully!",
                description: "You can now view your child's records.",
            });
            
            setParentIdInput('');
            await fetchParentProfileAndStudentData();

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
                <Logo compact={false} />
                <nav className="ml-auto flex gap-2 sm:gap-4">
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
                </nav>
            </header>
            <main className="flex-1 bg-muted/40 p-4 md:p-8">
                {hasLinkedChildren && studentData ? (
                    <ParentStudentProfile student={studentData} />
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
