
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, limit, query, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Lock } from 'lucide-react';

// --- Admin Dashboard Component ---
function AdminDashboard({ adminId }: { adminId: string }) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Marketplace Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome, Administrator. Manage your marketplace listings here.</p>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Listings</CardTitle>
                    <CardDescription>Create, edit, or delete items in the marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Listing management tools will appear here.</p>
                </CardContent>
                <CardFooter>
                    <Button>Add New Listing</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// --- Admin Registration Component ---
function AdminRegistration({ onRegister }: { onRegister: (adminId: string) => void }) {
    const { firestore, auth } = useFirebase();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const adminId = `MKT-ADMIN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            await setDoc(doc(firestore, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: user.email,
                role: 'marketplace_admin',
                userCode: adminId,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Admin Account Created", description: "You are now the marketplace administrator." });
            onRegister(user.uid);

        } catch (error) {
            const errorMessage = error instanceof FirebaseError ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Registration Failed', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Marketplace Admin Registration</CardTitle>
                <CardDescription>Create the primary administrator account for the marketplace. This can only be done once.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{isLoading ? 'Registering...' : 'Create Admin Account'}</Button>
                </CardFooter>
            </form>
        </Card>
    );
}

// --- Admin Login Component ---
function AdminLogin({ onLogin }: { onLogin: (adminId: string) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { auth, firestore } = useFirebase();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists() || userDocSnap.data().role !== 'marketplace_admin') {
                await auth.signOut();
                throw new Error("This account does not have marketplace administrator privileges.");
            }
            
            onLogin(user.uid);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Login Failed', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Marketplace Admin Login</CardTitle>
                <CardDescription>Enter your marketplace administrator credentials.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                     <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Login'}</Button>
                </CardFooter>
            </form>
        </Card>
    );
}

// --- Main Page Component ---
export default function MarketplaceAdminPage() {
    const { firestore, auth } = useFirebase();
    const { user: currentUser, isUserLoading } = useUser();
    const { toast } = useToast();
    
    const [pageState, setPageState] = useState<'loading' | 'dashboard' | 'login' | 'register' | 'denied'>('loading');
    const [adminId, setAdminId] = useState<string | null>(null);

    useEffect(() => {
        const checkAccess = async () => {
            if (isUserLoading) return;

            if (!currentUser) {
                // If no one is logged in, we need to check if a marketplace admin exists at all.
                const adminQuery = query(collection(firestore, 'users'), where('role', '==', 'marketplace_admin'), limit(1));
                const adminSnapshot = await getDocs(adminQuery);
                setPageState(adminSnapshot.empty ? 'register' : 'login');
                return;
            }
            
            // If a user is logged in, check their role.
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.role === 'admin' || userData.role === 'marketplace_admin') {
                    setAdminId(currentUser.uid);
                    setPageState('dashboard');
                } else {
                    setPageState('denied');
                }
            } else {
                 setPageState('denied');
            }
        };

        checkAccess();
    }, [firestore, currentUser, isUserLoading]);

    const handleLoginOrRegisterSuccess = (newAdminId: string) => {
        setAdminId(newAdminId);
        setPageState('dashboard');
    };

    if (pageState === 'loading') {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (pageState === 'dashboard' && adminId) {
        return <AdminDashboard adminId={adminId} />;
    }

    if (pageState === 'denied') {
        return (
             <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2"><Lock className="h-5 w-5" /> Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-center h-full">
            {pageState === 'login' && <AdminLogin onLogin={handleLoginOrRegisterSuccess} />}
            {pageState === 'register' && <AdminRegistration onRegister={handleLoginOrRegisterSuccess} />}
        </div>
    );
}
