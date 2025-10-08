
'use client';
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import placeholderImages from '@/lib/placeholder-images.json';
import { useAuth, useFirebase, setDocumentNonBlocking, initiateEmailSignUp } from '@/firebase';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { doc } from "firebase/firestore";

const registerImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

export default function RegisterPage() {
    const { firestore } = useFirebase();
    const auth = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await initiateEmailSignUp(auth, email, password);
            if (userCredential && userCredential.user) {
                const user = userCredential.user;
                const userRef = doc(firestore, "users", user.uid);
                const userCode = `NSMS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

                setDocumentNonBlocking(userRef, {
                    uid: user.uid,
                    name: fullName,
                    email: user.email,
                    schoolName: schoolName,
                    userCode: userCode,
                    profilePicture: `https://picsum.photos/seed/${user.uid}/100/100`
                }, { merge: true });
            }
            router.push('/dashboard');
        } catch (error) {
            console.error("Error during registration:", error);
            // You can add user-facing error messages here
        }
    };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
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
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold font-headline mt-4">Create an Account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to get started.
            </p>
          </div>
          <form onSubmit={handleRegister}>
            <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="school-name">School Name</Label>
                    <Input id="school-name" placeholder="Sunshine Primary School" required value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
                <Button type="submit" className="w-full">
                Create Account
                </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
