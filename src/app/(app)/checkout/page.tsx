
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import PaystackButton from '@/components/paystack/PaystackButton';
import { updateStockAfterPayment } from '@/app/(app)/marketplace/order-actions';

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
};

function CheckoutPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const productId = searchParams.get('productId');
    const productName = searchParams.get('name');
    const productPrice = searchParams.get('price');
    const productImageUrl = searchParams.get('imageUrl');

    const handlePurchaseSuccess = async (reference: { reference: string }) => {
        if (!productId) return;

        try {
            // Decrement stock
            await updateStockAfterPayment(productId, 1); // Assuming quantity is 1

            toast({
                title: '🎉 Purchase Successful!',
                description: `Your payment for "${productName}" was completed. Ref: ${reference.reference}`
            });

            // Redirect to marketplace after a short delay
            setTimeout(() => {
                router.push('/marketplace');
            }, 2000);

        } catch (error) {
            console.error("Error updating stock after payment:", error);
            toast({
                variant: 'destructive',
                title: 'Payment Processed, Stock Update Failed',
                description: 'Your payment was successful, but we couldn\'t update the stock. Please contact support.',
            });
        }
    };
    
    const handlePurchaseClose = () => {
        toast({ 
            title: 'Purchase Cancelled', 
            description: 'The payment process was not completed.',
            variant: 'default'
        });
    };

    if (!productId || !productName || !productPrice) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <CardTitle>Invalid Product</CardTitle>
                <CardDescription>The product details are missing. Please go back to the marketplace and try again.</CardDescription>
                <Button onClick={() => router.push('/marketplace')} className="mt-4">
                    Back to Marketplace
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
                    <div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                       {productImageUrl && (
                           <Image 
                                src={decodeURIComponent(productImageUrl)}
                                alt={productName}
                                fill
                                className="object-cover"
                           />
                       )}
                    </div>
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
                    onSuccess={handlePurchaseSuccess}
                    onClose={handlePurchaseClose}
                    isPurchase={true}
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
