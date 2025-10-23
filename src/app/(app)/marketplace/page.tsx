
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/contexts/plan-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
    const { plan, isTrial } = usePlan();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (plan) { // Ensure plan has been loaded
            if (isTrial) {
                toast({
                    variant: 'destructive',
                    title: 'Upgrade Required',
                    description: 'The marketplace is only available on paid plans.',
                });
                router.push('/billing');
            } else {
                setIsLoading(false);
            }
        }
    }, [plan, isTrial, router, toast]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying plan...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <h1 className="text-3xl font-bold font-headline mb-4">Marketplace</h1>
            <p className="text-muted-foreground mb-8">Browse listings from the community.</p>
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
