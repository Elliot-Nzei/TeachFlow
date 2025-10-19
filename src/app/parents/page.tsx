
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Search, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getStudentByParentId } from '@/app/actions/parent-access';
import type { Student, Grade } from '@/lib/types';
import StudentProfileContent from '@/components/student-profile-content';

type StudentData = Student & {
    grades: Grade[];
}

export default function ParentsPortalPage() {
    const [parentId, setParentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [studentData, setStudentData] = useState<StudentData | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentId) {
            setError('Please enter a Parent ID.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStudentData(null);

        try {
            const result = await getStudentByParentId(parentId);
            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setStudentData(result.data as StudentData);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (studentData) {
        return (
             <div className="flex min-h-screen w-full flex-col">
                <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
                    <Logo />
                    <nav className="ml-auto flex gap-2 sm:gap-4">
                    <Button variant="outline" onClick={() => setStudentData(null)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Portal
                    </Button>
                    </nav>
                </header>
                <main className="flex-1 bg-muted/40 p-4 md:p-8">
                   <StudentProfileContent studentId={studentData.id} readOnly />
                </main>
            </div>
        );
    }

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
                    <CardTitle className="text-3xl font-bold font-headline">Parents Portal</CardTitle>
                    <CardDescription>Enter the unique Parent ID to view your child's records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="parentId"
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value.toUpperCase())}
                                placeholder="PARENT-XXXX-YYYY-ZZZZ"
                                required
                                className="text-center"
                            />
                        </div>
                        {error && (
                             <Alert variant="destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Access Denied</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="mr-2 h-4 w-4" />
                            )}
                            View Student Information
                        </Button>
                    </form>
                     <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>Your Parent ID is provided by the school and is permanently assigned to your child.</p>
                    </div>
                </CardContent>
            </Card>
        </main>
        </div>
    );
}
