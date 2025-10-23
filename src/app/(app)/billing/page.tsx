
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';
import { cn, toTitleCase } from '@/lib/utils';
import { usePlan } from '@/contexts/plan-context';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const PaystackButton = dynamic(() => import('@/components/paystack/PaystackButton'), { ssr: false });

const plansData = [
  {
    name: 'Free Trial',
    id: 'free_trial',
    price: 0,
    priceAnnually: 0,
    description: 'For getting started and managing a small classroom.',
    isFeatured: false,
    features: [
      { text: 'Up to 25 Students' },
      { text: 'Up to 5 Classes' },
      { text: 'Limited AI Generations (3/mo)', included: true },
      { text: 'Secure Data Transfer', included: false },
      { text: 'Full System Export', included: false },
    ],
  },
  {
    name: 'Basic',
    id: 'basic',
    price: 1500,
    priceAnnually: 15000,
    description: 'Ideal for individual teachers managing multiple classes.',
    isFeatured: true,
    features: [
      { text: 'Up to 150 Students' },
      { text: 'Unlimited Classes' },
      { text: 'Standard AI Generations (15/mo)', included: true },
      { text: 'Secure Data Transfer', included: false },
      { text: 'Full System Export', included: false },
    ],
  },
  {
    name: 'Prime',
    id: 'prime',
    price: 3500,
    priceAnnually: 35000,
    description: 'For power users or small schools needing full capabilities.',
    isFeatured: false,
    features: [
      { text: 'Unlimited Students' },
      { text: 'Unlimited Classes' },
      { text: 'Unlimited AI Generations', included: true },
      { text: 'Secure Data Transfer', included: true },
      { text: 'Full System Export', included: true },
    ],
  },
];


export default function BillingPage() {
  const { plan: currentPlanId, subscriptionCycle: currentCycle, isSubscriptionExpired, daysRemaining } = usePlan();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(currentCycle || 'monthly');
  const { user } = useFirebase();
  const { toast } = useToast();

  const handleSuccess = async (reference: { reference: string }, newPlanId: string) => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to complete this action.', variant: 'destructive' });
        return;
    }
    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.reference, planId: newPlanId, billingCycle, userId: user.uid }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorDetails = result.details ? `Details: ${result.details}` : '';
        const errorSuggestion = result.suggestion ? `Suggestion: ${result.suggestion}` : '';
        throw new Error(`${result.message || 'Verification failed.'} ${errorDetails} ${errorSuggestion}`);
      }
      
      toast({ title: 'Payment Successful!', description: 'Your plan has been upgraded. The page will now reload.' });
      
      // Reload the page to get the new plan details from the context
      setTimeout(() => {
        window.location.reload();
      }, 1500);


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ 
          title: 'Verification Error',
          description: `There was an issue verifying your payment: ${errorMessage}. Please contact support if the issue persists.`,
          variant: 'destructive',
          duration: 9000 // Allow more time to read the detailed error
      });
    }
  };

  const handleClose = () => {
    toast({ title: 'Payment Cancelled', description: 'The payment process was not completed.' });
  };
  
  const getButtonText = (planId: string, planName: string, isCurrentPlan: boolean) => {
    if (isCurrentPlan && !isSubscriptionExpired) {
        return 'Your Current Plan';
    }
    if (planId === 'free_trial') {
        return 'Included';
    }
    if (isSubscriptionExpired) {
        if (currentPlanId === planId) {
            return 'Renew Plan';
        }
        return 'Choose Plan';
    }
    
    const planHierarchy = { 'free_trial': 0, 'basic': 1, 'prime': 2 };
    const currentPlanLevel = planHierarchy[currentPlanId as keyof typeof planHierarchy];
    const targetPlanLevel = planHierarchy[planId as keyof typeof planHierarchy];

    if (targetPlanLevel > currentPlanLevel) {
        return `Upgrade to ${planName}`;
    }
    if (targetPlanLevel < currentPlanLevel) {
        return `Downgrade to ${planName}`;
    }
    return `Select ${planName}`;
  };

  return (
    <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Choose Your Plan</h1>
            <p className="text-muted-foreground mt-2">
                Unlock more features and power up your school. Select the plan that fits your needs.
            </p>
             {currentPlanId && currentPlanId !== 'free_trial' && (
                <div className="mt-4 text-sm text-center">
                    <p>You are currently on the <b className="text-primary">{toTitleCase(currentPlanId)}</b> plan.
                    {daysRemaining > 0 ? ` Your plan renews in ${daysRemaining} day(s).` : ' Your subscription has expired.'}
                    </p>
                </div>
            )}
        </div>
        
        <div className="flex items-center justify-center space-x-2">
            <Label htmlFor="billing-cycle">Monthly</Label>
            <Switch
                id="billing-cycle"
                checked={billingCycle === 'annually'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
            />
            <Label htmlFor="billing-cycle" className="flex items-center">
                Annually
                <Badge variant="secondary" className="ml-2 text-primary">Save 2 Months!</Badge>
            </Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
            {plansData.map((plan) => {
                const isCurrentPlan = currentPlanId === plan.id;
                const price = billingCycle === 'monthly' ? plan.price : plan.priceAnnually;
                const displayPrice = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
                
                return (
                    <Card key={plan.id} className={cn("flex flex-col h-full", plan.isFeatured ? "border-primary border-2 shadow-lg" : "")}>
                        <CardHeader className="relative">
                            {plan.isFeatured && (
                                <Badge className="absolute top-0 right-4 -mt-3 w-fit">RECOMMENDED</Badge>
                            )}
                            <CardTitle className="font-headline">{plan.name}</CardTitle>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">
                                    {displayPrice}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                                </span>
                            </div>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <p className="font-semibold text-sm">Features include:</p>
                            <ul className="space-y-3 text-sm">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        {feature.included !== false ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
                                        )}
                                        <span>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                           <PaystackButton
                                email={user?.email || ''}
                                amount={price}
                                onSuccess={(ref) => handleSuccess(ref, plan.id)}
                                onClose={handleClose}
                                planName={plan.name}
                                isCurrentPlan={isCurrentPlan}
                                isSubscriptionExpired={isSubscriptionExpired || false}
                                billingCycle={billingCycle}
                                getButtonText={getButtonText}
                                planId={plan.id}
                            />
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    </div>
  );
}
