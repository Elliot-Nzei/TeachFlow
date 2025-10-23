
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

export default function MarketplacePage() {
    const [userId, setUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const handleAccessMarketplace = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!userId) {
            toast({
                variant: 'destructive',
                title: 'User ID Required',
                description: 'Please enter your user ID to access the marketplace.',
            });
            setIsLoading(false);
            return;
        }

        try {
            // This is a simplified access check. In a real app, you'd have more robust logic.
            const userRef = doc(firestore, 'users', userId);
            const userSnap = await getDoc(userRef);

            // A more realistic scenario would check a specific claim or role.
            // For now, we'll just check if the user exists.
            if (userSnap.exists()) {
                setHasAccess(true);
                toast({
                    title: 'Access Granted',
                    description: 'Welcome to the marketplace!',
                });
            } else {
                // Check if it's a marketplace admin
                const adminRef = doc(firestore, 'marketplace_admins', userId);
                const adminSnap = await getDoc(adminRef);
                if (adminSnap.exists()) {
                    setHasAccess(true);
                     toast({
                        title: 'Admin Access Granted',
                        description: 'Welcome, marketplace administrator!',
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Access Denied',
                        description: 'Invalid user ID. Please check and try again.',
                    });
                }
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not verify user ID. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (hasAccess) {
        return (
            <div>
                <h1 className="text-3xl font-bold font-headline mb-4">Marketplace</h1>
                <p className="text-muted-foreground mb-8">Browse listings from the community.</p>
                {/* Placeholder for marketplace content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Featured Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader><CardTitle>Digital Whiteboard</CardTitle></CardHeader>
                                <CardContent><p>A premium digital whiteboard for interactive lessons.</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Lesson Plan Pack</CardTitle></CardHeader>
                                <CardContent><p>100+ pre-made lesson plans for various subjects.</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Classroom Decor Set</CardTitle></CardHeader>
                                <CardContent><p>Printable decorations to brighten up your classroom.</p></CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Enter Marketplace</CardTitle>
                    <CardDescription>Please enter your User ID to access the marketplace.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAccessMarketplace}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-id">Your User ID</Label>
                            <Input
                                id="user-id"
                                placeholder="e.g., NSMS-0914L"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Continue'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
