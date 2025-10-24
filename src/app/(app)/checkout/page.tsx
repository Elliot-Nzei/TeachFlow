
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import PaystackButton from '@/components/paystack/PaystackButton';

function CheckoutPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();

    const productId = searchParams.get('productId');
    const productName = searchParams.get('name');
    const productPrice = searchParams.get('price');
    const productImageUrl = searchParams.get('imageUrl');
    const isSubscription = searchParams.get('isSubscription') === 'true';
    const billingCycle = searchParams.get('billingCycle');

    const handleSuccess = async (reference: { reference: string }) => {
        toast({
            title: '🎉 Payment Successful!',
            description: `Your payment was completed. Ref: ${reference.reference}`
        });

        // The verification and user update will be handled server-side by the webhook
        if (isSubscription) {
             const verifyResponse = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reference: reference.reference,
                    planId: productId,
                    billingCycle,
                    userId: user?.uid,
                    isSubscription: true
                }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
                // Redirect to billing page after a successful subscription payment
                setTimeout(() => router.push('/billing'), 2000);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Verification Failed',
                    description: verifyResult.message || 'There was an issue updating your subscription.',
                });
            }

        } else {
            // For product purchases, just redirect
            setTimeout(() => router.push('/marketplace'), 2000);
        }
    };
    
    const handleClose = () => {
        toast({ 
            title: 'Payment Cancelled', 
            description: 'The payment process was not completed.',
            variant: 'default'
        });
    };

    if (!productId || !productName || !productPrice) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <CardTitle>Invalid Product or Plan</CardTitle>
                <CardDescription>The details are missing. Please go back and try again.</CardDescription>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }
    
    const price = Number(productPrice);

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Confirm Your Purchase
                </CardTitle>
                <CardDescription>You are about to purchase the following item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                    {productImageUrl && (
                        <div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                           <Image 
                                src={decodeURIComponent(productImageUrl)}
                                alt={productName}
                                fill
                                className="object-cover"
                           />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="font-semibold">{productName}</p>
                        <p className="text-lg font-bold text-primary">₦{price.toLocaleString()}</p>
                    </div>
                </div>
                 <p className="text-xs text-muted-foreground text-center">You will be securely redirected to Paystack to complete your payment.</p>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <PaystackButton
                    email={user?.email || ''}
                    amount={price}
                    onSuccess={handleSuccess}
                    onClose={handleClose}
                    isPurchase={!isSubscription}
                />
                 <Button variant="ghost" onClick={() => router.back()} className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function CheckoutPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Suspense fallback={
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading Checkout...</span>
                </div>
            }>
                <CheckoutPageContent />
            </Suspense>
        </div>
    )
}
