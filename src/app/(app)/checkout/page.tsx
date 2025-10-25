
'use client';

import { Suspense, useState, useEffect, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShoppingCart, Home, Edit, Check } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import PaystackButton from '@/components/paystack/PaystackButton';
import { SettingsContext } from '@/contexts/settings-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { nigerianStates } from '@/lib/nigerian-states';

type ShippingAddress = {
    address?: string;
    state?: string;
    landmark?: string;
    phone?: string;
};

function CheckoutPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const { settings } = useContext(SettingsContext);

    const [isVerifying, setIsVerifying] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({});

    const productId = searchParams.get('productId');
    const productName = searchParams.get('name');
    const productPrice = searchParams.get('price');
    const productImageUrl = searchParams.get('imageUrl');
    const isSubscription = searchParams.get('isSubscription') === 'true';
    const isPhysicalGood = searchParams.get('category') === 'Physical Good';
    const billingCycle = searchParams.get('billingCycle');
    const quantity = searchParams.get('quantity') || '1';

    useEffect(() => {
        if (settings?.shippingAddress) {
            setShippingAddress(settings.shippingAddress);
        }
    }, [settings]);

    const handleShippingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setShippingAddress(prev => ({...prev, [e.target.id]: e.target.value }));
    }
    const handleShippingSelectChange = (id: string, value: string) => {
        setShippingAddress(prev => ({...prev, [id]: value }));
    }

    const handleSuccess = async (reference: { reference: string }) => {
        if (isVerifying) return;
        setIsVerifying(true);
        toast({ title: '🎉 Payment Successful!', description: 'Confirming your order...' });

        try {
            const bodyPayload = { 
                reference: reference.reference,
                userId: user?.uid,
                isSubscription: isSubscription,
                ...(isSubscription && { planId: productId, billingCycle }),
                ...(!isSubscription && {
                    productId: productId,
                    quantity: parseInt(quantity),
                    shippingAddress: isPhysicalGood ? shippingAddress : undefined,
                })
            };

            const verifyResponse = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
            });

            const verifyResult = await verifyResponse.json();

            if (!verifyResponse.ok) {
                // If the server returns an error, it's a verification failure.
                throw new Error(verifyResult.message || 'Verification request failed on the server.');
            }
            
            if (verifyResult.warning) {
                // Handle cases where payment is verified but another step failed (e.g., stock update)
                toast({
                    title: 'Payment Verified with a Warning',
                    description: verifyResult.message || 'Please contact support if your order details are not updated.',
                    duration: 10000,
                });
            } else {
                 toast({ title: 'Order Confirmed!', description: verifyResult.message || 'Your purchase has been confirmed.' });
            }
            
            // Redirect after successful verification
            const redirectPath = isSubscription ? '/billing' : '/marketplace';
            router.push(redirectPath);

        } catch (error) {
            console.error('Verification error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            
            toast({
                variant: 'destructive',
                title: 'Order Verification Failed',
                description: `Your payment may have been successful, but we could not confirm your order. Please contact support with payment reference. Error: ${errorMessage}`,
                duration: 15000, // Give user more time to read
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleClose = () => {
        if (!isVerifying) {
            toast({ title: 'Payment Cancelled', description: 'The payment process was not completed.' });
        }
    };

    if (!productId || !productName || !productPrice) {
        return (
            <Card className="w-full max-w-lg"><CardHeader><CardTitle>Invalid Product</CardTitle><CardDescription>Details are missing. Please go back.</CardDescription></CardHeader><CardFooter><Button onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></CardFooter></Card>
        );
    }
    
    const price = Number(productPrice);
    const quantityNum = parseInt(quantity);

    if (isNaN(price) || price < 0) {
        return (
            <Card className="w-full max-w-lg"><CardHeader><CardTitle>Invalid Price</CardTitle><CardDescription>Product price is invalid.</CardDescription></CardHeader><CardFooter><Button onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></CardFooter></Card>
        );
    }

    const isAddressComplete = isPhysicalGood ? (
        shippingAddress.address && shippingAddress.state && shippingAddress.phone
    ) : true;

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Confirm Your Purchase</CardTitle>
                <CardDescription>{isSubscription ? 'You are about to subscribe to this plan.' : 'Review your order details below.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                    {productImageUrl && <div className="relative h-20 w-20 flex-shrink-0 bg-muted rounded-md overflow-hidden"><Image src={decodeURIComponent(productImageUrl)} alt={productName} fill className="object-cover"/></div>}
                    <div className="flex-1">
                        <p className="font-semibold text-lg">{productName}</p>
                        {!isSubscription && <p className="text-sm text-muted-foreground">Quantity: {quantityNum}</p>}
                        <p className="text-2xl font-bold text-primary">₦{(price * quantityNum).toLocaleString()}</p>
                        {isSubscription && billingCycle && <p className="text-xs text-muted-foreground capitalize">Billed {billingCycle}</p>}
                    </div>
                </div>

                {isPhysicalGood && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2 text-lg"><Home className="h-5 w-5"/>Shipping Address</CardTitle>
                                {!isEditingAddress && (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)}><Edit className="mr-2 h-4 w-4"/>Change</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditingAddress ? (
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label htmlFor="address">Street Address</Label><Textarea id="address" value={shippingAddress.address || ''} onChange={handleShippingInputChange} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="state">State</Label><Select value={shippingAddress.state || ''} onValueChange={(v) => handleShippingSelectChange('state', v)}><SelectTrigger><SelectValue placeholder="Select state..."/></SelectTrigger><SelectContent>{nigerianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="space-y-2"><Label htmlFor="landmark">Nearest Landmark</Label><Input id="landmark" value={shippingAddress.landmark || ''} onChange={handleShippingInputChange} /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="phone">Contact Phone</Label><Input id="phone" type="tel" value={shippingAddress.phone || ''} onChange={handleShippingInputChange} /></div>
                                    <Button onClick={() => setIsEditingAddress(false)} className="w-full"><Check className="mr-2 h-4 w-4"/>Confirm Address</Button>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm">
                                    {isAddressComplete ? (
                                        <>
                                            <p className="font-medium">{shippingAddress.address}</p>
                                            <p className="text-muted-foreground">{shippingAddress.landmark}</p>
                                            <p className="text-muted-foreground">{shippingAddress.state}</p>
                                            <p className="font-semibold">{shippingAddress.phone}</p>
                                        </>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">Please add your shipping address.</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <PaystackButton email={user?.email || ''} amount={price * quantityNum} onSuccess={handleSuccess} onClose={handleClose} isPurchase={!isSubscription} disabled={isVerifying || !isAddressComplete} />
                <Button variant="ghost" onClick={() => router.back()} className="w-full" disabled={isVerifying}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
            </CardFooter>
        </Card>
    );
}

export default function CheckoutPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4"><Suspense fallback={<Card className="w-full max-w-md"><CardContent className="flex items-center justify-center gap-2 py-8"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading...</span></CardContent></Card>}><CheckoutPageContent /></Suspense></div>
    );
}
