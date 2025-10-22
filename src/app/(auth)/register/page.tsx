
'use client';
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useAuth, useFirebase } from '@/firebase';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ToastAction } from "@/components/ui/toast";
import placeholderImages from '@/lib/placeholder-images.json';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const registerImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

export default function RegisterPage() {
    const { firestore } = useFirebase();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [fullName, setFullName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential && userCredential.user) {
                const user = userCredential.user;
                
                const userCode = `NSMS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                
                await setDoc(doc(firestore, "users", user.uid), {
                    uid: user.uid,
                    name: fullName,
                    email: user.email,
                    schoolName: schoolName,
                    userCode: userCode,
                    profilePicture: `https://picsum.photos/seed/${user.uid}/100/100`,
                    studentCounter: 0,
                    currentTerm: 'First Term',
                    currentSession: '2023/2024',
                    plan: 'free_trial',
                    planStartDate: serverTimestamp(),
                });

                router.push('/dashboard');
            }
        } catch (error) {
            console.error("Error during registration:", error);
            if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
                toast({
                    variant: 'destructive',
                    title: 'Registration Failed',
                    description: 'This email is already in use. Please try another email or log in.',
                    action: <ToastAction altText="Go to Login" onClick={() => router.push('/login')}>Go to Login</ToastAction>,
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
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mb-4"><Logo /></div>
                <CardTitle className="text-3xl font-bold font-headline">Create an Account</CardTitle>
                <CardDescription>Enter your information to get started with TeachFlow.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={e => setFullName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="school-name">School Name</Label>
                            <Input id="school-name" placeholder="Sunshine Primary" required value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                     <div className="text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline">
                        Login
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
      </div>
      <div className="hidden bg-muted lg:block">
        {registerImage && (
            <Image
                src={registerImage.imageUrl}
                alt={registerImage.description}
                width="1920"
                height="1080"
                className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                data-ai-hint={registerImage.imageHint}
            />
        )}
      </div>
    </div>
  )
}
