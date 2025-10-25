
'use client';

import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Purchase } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { format } from 'date-fns';
import { ShoppingCart, AlertCircle, PackageSearch } from 'lucide-react';

export default function PurchaseHistory() {
    const { firestore, user } = useFirebase();

    const purchasesQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'purchases'), orderBy('createdAt', 'desc')) : null,
        [firestore, user]
    );

    const { data: purchases, isLoading, error } = useCollection<Purchase>(purchasesQuery);

    if (isLoading) {
        return (
            <div className="space-y-4 py-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }
    
    if (error) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load your purchase history.</AlertDescription>
            </Alert>
        );
    }

    return (
        <ScrollArea className="h-full pr-6 -mr-6">
            <div className="py-4 space-y-4">
                {purchases && purchases.length > 0 ? (
                    purchases.map(purchase => (
                        <Card key={purchase.id} className="border-l-4 border-primary">
                            <CardContent className="p-4 flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">{purchase.productName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Qty: {purchase.quantity} • ₦{purchase.amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(purchase.createdAt.toDate(), 'PPP')}
                                    </p>
                                </div>
                                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-semibold">No Purchases Yet</p>
                        <p className="text-sm">Your purchased items will appear here.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
