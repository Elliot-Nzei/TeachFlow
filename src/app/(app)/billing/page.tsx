
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Zap, Star, Lock } from 'lucide-react';
import { cn, toTitleCase } from '@/lib/utils';
import { usePlan } from '@/contexts/plan-context';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const plansData = [
  {
    name: 'Free Trial',
    id: 'free_trial',
    price: '₦0',
    priceAnnually: '₦0',
    description: 'For getting started and managing a small classroom.',
    isFeatured: false,
    features: [
      { text: 'Up to 25 Students' },
      { text: 'Up to 5 Classes' },
      { text: 'AI Report Card Generation', included: false },
      { text: 'AI Lesson Note Generation', included: false },
      { text: 'AI Exam Question Generation', included: false },
      { text: 'Secure Data Transfer', included: false },
      { text: 'Full System Export', included: false },
    ],
  },
  {
    name: 'Basic',
    id: 'basic',
    price: '₦1,500',
    priceAnnually: '₦15,000',
    description: 'Ideal for individual teachers managing multiple classes.',
    isFeatured: true,
    features: [
      { text: 'Up to 150 Students' },
      { text: 'Unlimited Classes' },
      { text: 'AI Report Card Generation (15/mo)', included: true },
      { text: 'AI Lesson Note Generation (15/mo)', included: true },
      { text: 'AI Exam Question Generation (15/mo)', included: true },
      { text: 'Secure Data Transfer', included: false },
      { text: 'Full System Export', included: false },
    ],
  },
  {
    name: 'Prime',
    id: 'prime',
    price: '₦3,500',
    priceAnnually: '₦35,000',
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


const SubscriptionStatusCard = () => {
    const { plan, isTrial, subscriptionCycle, renewalDate } = usePlan();
    const [timeLeft, setTimeLeft] = useState('');

    const planName = useMemo(() => {
        if (!plan) return 'Free';
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }, [plan]);

    useEffect(() => {
        if (!renewalDate) {
            setTimeLeft('N/A');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const secondsRemaining = Math.max(0, Math.floor((renewalDate.getTime() - now.getTime()) / 1000));
            
            if (secondsRemaining <= 0) {
                setTimeLeft('Expired');
                clearInterval(interval);
                return;
            }
            
            const hours = Math.floor(secondsRemaining / 3600);
            const minutes = Math.floor((secondsRemaining % 3600) / 60);
            const seconds = secondsRemaining % 60;
            
            if (hours > 0) {
              setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            } else {
              setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }


        }, 1000);

        return () => clearInterval(interval);
    }, [renewalDate]);

    if (isTrial || !plan || !renewalDate || timeLeft === 'N/A') {
        return null;
    }

    return (
        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap /> Your Current Plan</CardTitle>
                 <CardDescription className="text-primary-foreground/80">
                    You are currently subscribed to the {toTitleCase(plan)} plan.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                    <p className="text-sm text-primary-foreground/80">Plan</p>
                    <p className="text-xl font-bold">{toTitleCase(plan)}</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                    <p className="text-sm text-primary-foreground/80">Billing Cycle</p>
                    <p className="text-xl font-bold">{subscriptionCycle ? toTitleCase(subscriptionCycle) : 'N/A'}</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg col-span-2 md:col-span-1">
                    <p className="text-sm text-primary-foreground/80">
                        {timeLeft === 'Expired' ? 'Status' : 'Time Remaining'}
                    </p>
                    <p className="text-xl font-bold font-mono">{timeLeft}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillingPage() {
  const { plan: currentPlanId, isSubscriptionExpired } = usePlan();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const handleUpgrade = async (newPlanId: 'basic' | 'prime') => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to upgrade.' });
          return;
      }
      try {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
              plan: newPlanId,
              subscriptionCycle: billingCycle,
              planStartDate: serverTimestamp(), // Reset the start date to now
          });
          toast({
              title: 'Plan Updated!',
              description: `You have successfully upgraded to the ${toTitleCase(newPlanId)} Plan.`,
          });
          // Force a reload to ensure the new context takes effect everywhere
          window.location.reload();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Upgrade Failed', description: 'Could not update your plan.' });
      }
  };
  
  return (
    <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Choose Your Plan</h1>
            <p className="text-muted-foreground mt-2">
                Unlock more features and power up your school. Select the plan that fits your needs.
            </p>
        </div>

        <SubscriptionStatusCard />
        
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
                
                return (
                    <Card key={plan.id} className={cn("flex flex-col h-full", plan.isFeatured ? "border-primary border-2 shadow-lg" : "")}>
                        <CardHeader className="relative">
                            {plan.isFeatured && (
                                <Badge className="absolute top-0 right-4 -mt-3 w-fit">RECOMMENDED</Badge>
                            )}
                            <CardTitle className="font-headline">{plan.name}</CardTitle>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">
                                    {billingCycle === 'monthly' ? plan.price : plan.priceAnnually}
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
                           <Button
                                className="w-full"
                                variant={isCurrentPlan && !isSubscriptionExpired ? 'outline' : (plan.isFeatured ? 'default' : 'outline')}
                                disabled={(isCurrentPlan && !isSubscriptionExpired) || plan.id === 'free_trial'}
                                onClick={() => handleUpgrade(plan.id as 'basic' | 'prime')}
                            >
                                {isCurrentPlan && isSubscriptionExpired ? 'Renew Plan' 
                                 : isCurrentPlan && !isSubscriptionExpired ? 'Your Current Plan'
                                 : plan.id === 'free_trial' ? 'Included'
                                 : `Upgrade to ${plan.name}`
                                }
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    </div>
  );
}
