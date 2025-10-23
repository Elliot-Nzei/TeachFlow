
'use client';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useAuth, useFirebase } from '@/firebase';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ParentLoginPage() {
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!auth) throw new Error("Auth service is not available");
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/parents/dashboard');
    } catch (error) {
        console.error("Error during parent login:", error);
        let description = 'An unexpected error occurred. Please try again.';
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'Invalid email or password. Please check your credentials and try again.';
            }
        }
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
            <Logo compact={false} />
            <nav className="ml-auto flex gap-2 sm:gap-4">
            <Link href="/login" passHref>
                <Button variant="outline">Teacher Login</Button>
            </Link>
            </nav>
        </header>
        <main className="flex flex-1 items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md">
                 <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold font-headline">Parent Login</CardTitle>
                    <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {/* <Link
                                href="/forgot-password" // TODO: Parent-specific forgot password
                                className="ml-auto inline-block text-sm underline"
                            >
                                Forgot your password?
                            </Link> */}
                            </div>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/parents/register" className="underline">
                        Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  )
}
