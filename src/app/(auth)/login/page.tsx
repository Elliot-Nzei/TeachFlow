
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import placeholderImages from '@/lib/placeholder-images.json';
import { doc, getDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const loginImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

export default function LoginPage() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
              router.push('/admin');
          } else {
              router.push('/dashboard');
          }
      } else {
         // This case should ideally not happen if registration is done correctly
         await auth.signOut();
         throw new Error('User profile not found.');
      }
      
    } catch (error) {
        console.error("Error during login:", error);
        let description = 'An unexpected error occurred. Please try again.';
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'Invalid email or password. Please check your credentials and try again.';
            }
        } else if (error instanceof Error) {
            description = error.message;
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
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mb-4"><Logo /></div>
              <CardTitle className="text-3xl font-bold font-headline">Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                      <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                          href="/forgot-password"
                          className="ml-auto inline-block text-sm underline"
                      >
                          Forgot your password?
                      </Link>
                      </div>
                      <Input 
                          id="password" 
                          type="password" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                  </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <div className="text-center text-sm">
                      Don&apos;t have an account?{" "}
                      <Link href="/register" className="underline">
                      Sign up
                      </Link>
                  </div>
              </CardFooter>
            </form>
        </Card>
      </div>
       <div className="hidden bg-muted lg:block">
        {loginImage && (
            <Image
                src={loginImage.imageUrl}
                alt={loginImage.description}
                width="1920"
                height="1080"
                className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                data-ai-hint={loginImage.imageHint}
            />
        )}
      </div>
    </div>
  )
}
