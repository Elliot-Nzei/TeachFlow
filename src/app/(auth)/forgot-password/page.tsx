
'use client';
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import placeholderImages from '@/lib/placeholder-images.json';
import { ChevronLeft, MailCheck } from "lucide-react"
import { useAuth } from "@/firebase";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";

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
                <div className="flex items-center justify-center py-12">
                    <div className="mx-auto grid w-[350px] gap-6 text-center">
                         <MailCheck className="h-16 w-16 text-primary mx-auto" />
                         <h1 className="text-3xl font-bold font-headline mt-4">Check Your Email</h1>
                        <p className="text-balance text-muted-foreground">
                            A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and spam folder.
                        </p>
                        <Link href="/login" className="inline-flex items-center justify-center text-sm text-primary hover:underline">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
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
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold font-headline mt-4">Forgot Password</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
          <form onSubmit={handleResetPassword}>
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link
                href="/login"
                className="flex items-center justify-center text-sm"
                >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
