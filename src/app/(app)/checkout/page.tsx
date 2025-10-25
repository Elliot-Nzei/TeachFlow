'use client';

import { Suspense, useState } from 'react';
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
    const [isVerifying, setIsVerifying] = useState(false);

    const productId = searchParams.get('productId');
    const productName = searchParams.get('name');
    const productPrice = searchParams.get('price');
    const productImageUrl = searchParams.get('imageUrl');
    const isSubscription = searchParams.get('isSubscription') === 'true';
    const billingCycle = searchParams.get('billingCycle');
    const quantity = searchParams.get('quantity') || '1'; // Get quantity from URL

    const handleSuccess = async (reference: { reference: string }) => {
        if (isVerifying) return; // Prevent duplicate calls
        
        setIsVerifying(true);
        
        toast({
            title: '🎉 Payment Successful!',
            description: 'We are confirming your order...',
            duration: 5000,
        });

        try {
            const verifyResponse = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reference: reference.reference,
                    userId: user?.uid,
                    isSubscription: isSubscription,
                    // For subscriptions
                    ...(isSubscription && {
                        planId: productId,
                        billingCycle,
                    }),
                    // For products
                    ...(!isSubscription && {
                        productId: productId,
                        quantity: parseInt(quantity),
                    })
                }),
            });

            if (!verifyResponse.ok) {
                const errorResult = await verifyResponse.json();
                throw new Error(errorResult.message || 'Verification request failed');
            }

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
                toast({
                    title: 'Order Confirmed!',
                    description: verifyResult.message || 'Your purchase has been confirmed.',
                    duration: 5000,
                });
                
                // Redirect based on purchase type
                setTimeout(() => {
                    if (isSubscription) {
                        router.push('/billing');
                    } else {
                        router.push('/marketplace');
                    }
                }, 2000);
            } else {
                throw new Error(verifyResult.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: error instanceof Error ? error.message : 'There was an issue confirming your purchase. Please contact support.',
                duration: 8000,
            });
            setIsVerifying(false);
        }
    };
    
    const handleClose = () => {
        if (!isVerifying) {
            toast({ 
                title: 'Payment Cancelled', 
                description: 'The payment process was not completed.',
                variant: 'default'
            });
        }
    };

    if (!productId || !productName || !productPrice) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Invalid Product or Plan</CardTitle>
                    <CardDescription>The details are missing. Please go back and try again.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => router.back()} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                    </Button>
                </CardFooter>
            </Card>
        );
    }
    
    const price = Number(productPrice);
    const quantityNum = parseInt(quantity);

    if (isNaN(price) || price < 0) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Invalid Price</CardTitle>
                    <CardDescription>The product price is invalid. Please go back and try again.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => router.back()} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Confirm Your Purchase
                </CardTitle>
                <CardDescription>
                    {isSubscription ? 'You are about to subscribe to this plan.' : 'You are about to purchase the following item.'}
                </CardDescription>
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
                        {!isSubscription && quantityNum > 1 && (
                            <p className="text-sm text-muted-foreground">Quantity: {quantityNum}</p>
                        )}
                        <p className="text-lg font-bold text-primary">
                            ₦{(price * quantityNum).toLocaleString()}
                            {!isSubscription && quantityNum > 1 && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    (₦{price.toLocaleString()} each)
                                </span>
                            )}
                        </p>
                        {isSubscription && billingCycle && (
                            <p className="text-xs text-muted-foreground capitalize">
                                Billed {billingCycle}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    You will be securely redirected to Paystack to complete your payment.
                </p>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <PaystackButton
                    email={user?.email || ''}
                    amount={price * quantityNum}
                    onSuccess={handleSuccess}
                    onClose={handleClose}
                    isPurchase={!isSubscription}
                    disabled={isVerifying}
                />
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()} 
                    className="w-full"
                    disabled={isVerifying}
                >
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
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center gap-2 py-8">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading Checkout...</span>
                    </CardContent>
                </Card>
            }>
                <CheckoutPageContent />
            </Suspense>
        </div>
    )
}
