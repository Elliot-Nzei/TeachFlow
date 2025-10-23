
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Wrench } from 'lucide-react';

export default function ParentsPortalPage() {

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
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Wrench className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-headline">Coming Soon!</CardTitle>
                    <CardDescription>The Parents Portal is currently under construction. We're working hard to bring you a great experience.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature will allow parents to securely view their child's academic progress, attendance, and more. Stay tuned for updates!
                    </p>
                </CardContent>
            </Card>
        </main>
        </div>
    );
}
