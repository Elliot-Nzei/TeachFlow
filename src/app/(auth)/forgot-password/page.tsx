
'use client';
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import placeholderImages from '@/lib/placeholder-images.json';
import { ChevronLeft, MailCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/firebase";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const forgotPasswordImage = placeholderImages.placeholderImages.find(img => img.id === 'hero-students');

export default function ForgotPasswordPage() {
    const auth = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setIsSubmitted(true);
        } catch (error) {
            let description = 'An unexpected error occurred. Please try again.';
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/user-not-found') {
                    description = 'No user found with this email address.';
                }
            }
            toast({
                variant: 'destructive',
                title: 'Request Failed',
                description,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isSubmitted) {
        return (
             <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
                <div className="flex items-center justify-center p-6 sm:p-12">
                     <Card className="w-full max-w-md text-center">
                        <CardHeader>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                                <MailCheck className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold font-headline">Check Your Email</CardTitle>
                            <CardDescription>
                                A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and spam folder.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/login">
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Return to Login
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="hidden bg-muted lg:block">
                    {forgotPasswordImage && (
                        <Image
                            src={forgotPasswordImage.imageUrl}
                            alt={forgotPasswordImage.description}
                            width="1920"
                            height="1080"
                            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                            data-ai-hint={forgotPasswordImage.imageHint}
                        />
                    )}
                </div>
            </div>
        )
    }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mb-4"><Logo /></div>
                <CardTitle className="text-3xl font-bold font-headline">Forgot Password</CardTitle>
                <CardDescription>
                    No problem. Enter your email and we'll send you a link to reset it.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
                <CardContent>
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
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <Button variant="link" asChild>
                        <Link href="/login">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </Button>
                </CardFooter>
            </form>
        </Card>
      </div>
       <div className="hidden bg-muted lg:block">
        {forgotPasswordImage && (
            <Image
                src={forgotPasswordImage.imageUrl}
                alt={forgotPasswordImage.description}
                width="1920"
                height="1080"
                className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                data-ai-hint={forgotPasswordImage.imageHint}
            />
        )}
      </div>
    </div>
  )
}
