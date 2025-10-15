
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function ParentsPortalComingSoonPage() {
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
                <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
                    <Construction className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline">Parents Portal</CardTitle>
                <CardDescription className="text-xl text-muted-foreground">Coming Soon!</CardDescription>
            </CardHeader>
            <CardContent>
                <p>We are working hard to bring you a dedicated space to track your child's academic progress, view results, and download report cards.</p>
                <p className="font-semibold mt-4">Stay tuned for updates!</p>
                <Button asChild className="mt-6">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Homepage
                  </Link>
                </Button>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
