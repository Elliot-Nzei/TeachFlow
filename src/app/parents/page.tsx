'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function ParentsPortalPage() {

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
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Parents Portal</CardTitle>
                    <CardDescription>Welcome, parents! Please log in or create an account to view your child's academic progress.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Link href="/parents/login">
                        <Button className="w-full" size="lg">
                            <KeyRound className="mr-2 h-5 w-5" />
                            Parent Login
                        </Button>
                    </Link>
                     <Link href="/parents/register">
                        <Button variant="secondary" className="w-full" size="lg">
                             Create Parent Account
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </main>
        </div>
    );
}
