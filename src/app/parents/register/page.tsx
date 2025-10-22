
'use client';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useFirebase } from '@/firebase';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, getDocs, collectionGroup, where, query, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getStudentByParentId } from "@/app/actions/parent-access";

export default function ParentRegisterPage() {
    const { firestore, auth } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!firestore || !auth) throw new Error("Firebase services not available.");

            // 1. Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create parent profile in 'parents' collection
            await setDoc(doc(firestore, "parents", user.uid), {
                uid: user.uid,
                name: fullName,
                email: user.email,
                linkedStudentIds: [],
                linkedParentIds: [],
                createdAt: serverTimestamp(),
            });

            router.push('/parents/dashboard');

        } catch (error) {
            console.error("Error during parent registration:", error);
            if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
                toast({
                    variant: 'destructive',
                    title: 'Email Already Registered',
                    description: 'This email is already associated with an account. Please use a different email or log in.',
                    action: <ToastAction altText="Go to Login" onClick={() => router.push('/parents/login')}>Go to Login</ToastAction>,
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Registration Failed',
                    description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

  return (
     <div className="flex min-h-screen w-full flex-col">
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
            <Logo />
            <nav className="ml-auto flex gap-2 sm:gap-4">
            <Link href="/login" passHref>
                <Button variant="outline">Teacher Login</Button>
            </Link>
            </nav>
        </header>
        <main className="flex flex-1 items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md">
                 <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold font-headline">Create Parent Account</CardTitle>
                    <CardDescription>
                        Sign up to get easy access to your child's records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full-name">Full Name</Label>
                                <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/parents/login" className="underline">
                        Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  )
}
