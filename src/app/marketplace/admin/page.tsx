
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { collection, getDocs, limit, query, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

// --- Admin Dashboard Component ---
function AdminDashboard({ adminId }: { adminId: string }) {
    // Here you would fetch and display marketplace listings, user data, etc.
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
                    {/* Placeholder for listing management UI */}
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

            // We use the user's UID for the document ID to link auth and Firestore
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
            console.error("Admin registration error:", error);
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
    const [adminIdInput, setAdminIdInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // In a real scenario, this would involve a proper auth flow.
            // For this implementation, we are just checking if a user with this ID and role exists.
            const q = query(collection(firestore, 'users'), where('userCode', '==', adminIdInput), where('role', '==', 'marketplace_admin'), limit(1));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                throw new Error("Invalid Marketplace Admin ID.");
            }
            const adminDoc = querySnapshot.docs[0];
            onLogin(adminDoc.id);

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
                <CardDescription>Enter your unique Marketplace Admin ID to manage listings.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-2">
                    <Label htmlFor="admin-id">Admin ID</Label>
                    <Input id="admin-id" placeholder="MKT-ADMIN-..." value={adminIdInput} onChange={(e) => setAdminIdInput(e.target.value.toUpperCase())} required />
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
    const { firestore } = useFirebase();
    const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
    const [loggedInAdminId, setLoggedInAdminId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            setIsLoading(true);
            const adminQuery = query(collection(firestore, 'users'), where('role', '==', 'marketplace_admin'), limit(1));
            const adminSnapshot = await getDocs(adminQuery);
            const adminExists = !adminSnapshot.empty;
            setHasAdmin(adminExists);
            setIsLoading(false);
        };
        checkAdmin();
    }, [firestore, loggedInAdminId]); // Re-check if an admin logs in

    const handleLoginSuccess = (adminId: string) => {
        setLoggedInAdminId(adminId);
        // Persist login state, e.g., in sessionStorage
        sessionStorage.setItem('marketplaceAdminId', adminId);
    };
    
     const handleRegisterSuccess = (adminId: string) => {
        setLoggedInAdminId(adminId);
        setHasAdmin(true);
        sessionStorage.setItem('marketplaceAdminId', adminId);
    };

    useEffect(() => {
        const storedAdminId = sessionStorage.getItem('marketplaceAdminId');
        if (storedAdminId) {
            setLoggedInAdminId(storedAdminId);
        }
    }, []);

    if (isLoading || hasAdmin === null) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (loggedInAdminId) {
        return <AdminDashboard adminId={loggedInAdminId} />;
    }

    return (
        <div className="flex items-center justify-center h-full">
            {hasAdmin ? <AdminLogin onLogin={handleLoginSuccess} /> : <AdminRegistration onRegister={handleRegisterSuccess} />}
        </div>
    );
}
