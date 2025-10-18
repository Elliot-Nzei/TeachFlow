
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Zap, Infinity, Lock, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlan } from '@/contexts/plan-context';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const plansData = [
  {
    name: 'Free',
    id: 'free_trial',
    price: '₦0',
    priceAnnually: '₦0',
    description: 'For getting started and managing a small classroom.',
    isFeatured: false,
    features: [
      { text: 'Up to 25 Students', included: true },
      { text: 'Up to 5 Classes', included: true },
      { text: 'AI Report Card Generation', included: false },
      { text: 'AI Lesson Note Generation', included: false },
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
      { text: 'Up to 150 Students', included: true },
      { text: 'Unlimited Classes', included: true },
      { text: 'AI Report Card Generation', included: true },
      { text: 'AI Lesson Note Generation', included: true },
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
        { text: 'Unlimited Students', included: true },
        { text: 'Unlimited Classes', included: true },
        { text: 'AI Report Card Generation', included: true },
        { text: 'AI Lesson Note Generation', included: true },
        { text: 'Secure Data Transfer', included: true },
        { text: 'Full System Export', included: true },
    ],
  },
];


const PlanCard = ({ plan, cycle, currentPlanId }: { plan: typeof plansData[0], cycle: 'monthly' | 'annually', currentPlanId: string | null}) => {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async (newPlanId: 'basic' | 'prime') => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to upgrade your plan.',
            });
            return;
        }

        setIsUpgrading(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                plan: newPlanId,
                subscriptionCycle: cycle,
                subscriptionStartDate: serverTimestamp(),
            });
            toast({
                title: 'Plan Updated!',
                description: `You have successfully upgraded to the ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} Plan.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Upgrade Failed',
                description: 'Could not update your plan. Please try again.',
            });
        } finally {
            setIsUpgrading(false);
        }
    };
    
    const isCurrentPlan = currentPlanId === plan.id;
    let buttonContent;

    if (isCurrentPlan) {
        buttonContent = <Button className="w-full" variant="outline" disabled>Your Current Plan</Button>;
    } else {
        buttonContent = (
            <Button 
                className="w-full" 
                variant={plan.isFeatured ? 'default' : 'outline'}
                disabled={isUpgrading || plan.id === 'free_trial'}
                onClick={() => handleUpgrade(plan.id as 'basic' | 'prime')}
            >
                {isUpgrading ? 'Upgrading...' : (
                    <>
                        {plan.id !== 'free_trial' && <Zap className="mr-2 h-4 w-4" />}
                        {plan.id === 'free_trial' ? 'Included' : `Upgrade to ${plan.name}`}
                    </>
                )}
            </Button>
        );
    }
    
    return (
        <Card className={cn("flex flex-col", plan.isFeatured ? "border-primary border-2" : "")}>
            <CardHeader className="relative">
                 {plan.isFeatured && (
                    <div className="absolute top-0 right-4 -mt-3 bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1">
                        RECOMMENDED
                    </div>
                )}
                <CardTitle className="font-headline">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                        {cycle === 'monthly' ? plan.price : plan.priceAnnually}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        /{cycle === 'monthly' ? 'month' : 'year'}
                    </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                            {feature.included ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground/70 flex-shrink-0" />
                            )}
                            <span>{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
               {buttonContent}
            </CardFooter>
        </Card>
    );
};

const SubscriptionStatusCard = () => {
    const { plan, isTrial, subscriptionCycle, renewalDate, daysRemaining } = usePlan();

    if (isTrial || !plan || !renewalDate) {
        return null; // Don't show this card for free trial users or if data is missing
    }

    const planName = useMemo(() => {
        if (!plan) return 'Free';
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }, [plan]);

    return (
        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BadgeCheck /> Your Current Plan</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    You are currently subscribed to the {planName} plan.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                    <p className="text-sm text-primary-foreground/80">Plan</p>
                    <p className="text-xl font-bold">{planName}</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg">
                    <p className="text-sm text-primary-foreground/80">Billing Cycle</p>
                    <p className="text-xl font-bold">{subscriptionCycle === 'annually' ? 'Annual' : 'Monthly'}</p>
                </div>
                <div className="bg-primary-foreground/10 p-3 rounded-lg col-span-2 md:col-span-1">
                    <p className="text-sm text-primary-foreground/80">
                        {daysRemaining > 0 ? `Renews on` : `Expired on`}
                    </p>
                    <p className="text-xl font-bold">{format(renewalDate, 'PPP')}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillingPage() {
  const { plan: currentPlanId } = usePlan();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

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
                <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                    Save 2 Months!
                </span>
            </Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plansData.map((plan) => (
                <PlanCard key={plan.id} plan={plan} cycle={billingCycle} currentPlanId={currentPlanId} />
            ))}
        </div>
    </div>
  );
}
