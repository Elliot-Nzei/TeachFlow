
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Zap, Infinity, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlan } from '@/contexts/plan-context';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const plansData = [
  {
    name: 'Free',
    id: 'free_trial',
    price: '₦0',
    priceAnnually: '₦0',
    description: 'Perfect for getting started and managing a small classroom.',
    buttonLabel: 'Your Current Plan',
    isFeatured: false,
    features: {
      'Student Limit': 'Up to 25',
      'Class Limit': 'Up to 5',
      'AI Tools': false,
      'Data Transfer': false,
      'System Export': false,
    },
  },
  {
    name: 'Basic',
    id: 'basic',
    price: '₦1,500',
    priceAnnually: '₦15,000',
    description: 'Ideal for individual teachers managing multiple classes.',
    buttonLabel: 'Upgrade to Basic',
    isFeatured: true,
    features: {
      'Student Limit': 'Up to 150',
      'Class Limit': 'Unlimited',
      'AI Tools': true,
      'Data Transfer': false,
      'System Export': false,
    },
  },
  {
    name: 'Prime',
    id: 'prime',
    price: '₦3,500',
    priceAnnually: '₦35,000',
    description: 'For power users or small schools needing full capabilities.',
    buttonLabel: 'Upgrade to Prime',
    isFeatured: false,
    features: {
      'Student Limit': 'Unlimited',
      'Class Limit': 'Unlimited',
      'AI Tools': true,
      'Data Transfer': true,
      'System Export': true,
    },
  },
];

const featureLabels: (keyof typeof plansData[0]['features'])[] = [
    'Student Limit',
    'Class Limit',
    'AI Tools',
    'Data Transfer',
    'System Export',
];

const FeatureRow = ({ label, value }: { label: string, value: string | boolean }) => {
    const renderValue = () => {
        if (typeof value === 'boolean') {
            return value ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-muted-foreground" />;
        }
        if (value === 'Unlimited') {
            return <Infinity className="h-5 w-5 text-primary" />;
        }
        return <span className="font-semibold">{value}</span>;
    };

    return (
        <li className="flex items-center justify-between py-3 border-b">
            <span className="text-muted-foreground">{label}</span>
            {renderValue()}
        </li>
    );
}

export default function BillingPage() {
  const { plan: currentPlanId } = usePlan();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const isMobile = useIsMobile();

  const handleUpgrade = async (newPlanId: 'basic' | 'prime') => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to upgrade your plan.',
      });
      return;
    }

    setIsUpgrading(newPlanId);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        plan: newPlanId,
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
      setIsUpgrading(null);
    }
  };

  const PlanButton = ({ planId }: { planId: string }) => {
     if (currentPlanId === planId) {
        return <Button className="w-full" variant="outline" disabled>Your Current Plan</Button>;
     }
     const plan = plansData.find(p => p.id === planId);
     if (!plan) return null;

     return (
        <Button 
            className="w-full" 
            disabled={isUpgrading !== null}
            onClick={() => handleUpgrade(planId as 'basic' | 'prime')}
        >
            {isUpgrading === planId ? 'Upgrading...' : (
                <>
                    <Zap className="mr-2 h-4 w-4" />
                    {plan.buttonLabel}
                </>
            )}
        </Button>
     );
  }

  // Mobile View
  if (isMobile) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold font-headline">Choose Your Plan</h1>
                <p className="text-muted-foreground mt-2">
                Unlock more features and power up your school.
                </p>
            </div>
            <Accordion type="single" collapsible defaultValue={currentPlanId || 'basic'}>
                {plansData.map((plan) => (
                    <AccordionItem value={plan.id} key={plan.id} className="border-0 mb-4">
                        <Card className={cn("border-2", plan.isFeatured ? "border-primary" : "border-border")}>
                            <AccordionTrigger className="p-4 hover:no-underline">
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center">
                                      <h3 className="text-lg font-bold font-headline">{plan.name}</h3>
                                      {plan.isFeatured && <div className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">RECOMMENDED</div>}
                                    </div>
                                    <p className="text-2xl font-bold">{billingCycle === 'monthly' ? plan.price : plan.priceAnnually}<span className="text-sm font-normal text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span></p>
                                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <ul className="space-y-2 text-sm mt-4">
                                    {featureLabels.map(label => (
                                        <FeatureRow key={label} label={label} value={plan.features[label]}/>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    <PlanButton planId={plan.id}/>
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
  }

  // Desktop View
  return (
    <div className="space-y-6">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Choose Your Plan</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Unlock more features and power up your school. Select the plan that fits your needs.
            </p>
        </div>

        <Card>
            <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-6">
                    {/* Feature labels column */}
                    <div className="col-span-1 pt-24">
                        <ul className="space-y-4">
                            {featureLabels.map(label => (
                                <li key={label} className="h-12 flex items-center text-sm font-medium">{label}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Plan columns */}
                    {plansData.map(plan => (
                        <div key={plan.id} className={cn("col-span-1 text-center p-6 rounded-lg", plan.isFeatured ? "bg-primary/5 border-2 border-primary" : "")}>
                            {plan.isFeatured && <div className="mb-2 text-xs font-bold text-primary">RECOMMENDED</div>}
                            <h3 className="text-xl font-bold font-headline">{plan.name}</h3>
                            <p className="text-3xl font-bold my-2">{billingCycle === 'monthly' ? plan.price : plan.priceAnnually}<span className="text-sm font-normal text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span></p>
                            <p className="text-xs text-muted-foreground h-8">{plan.description}</p>
                            
                            <div className="my-6">
                               <PlanButton planId={plan.id} />
                            </div>
                            
                            <ul className="space-y-4">
                               {featureLabels.map(label => (
                                   <li key={label} className="h-12 flex items-center justify-center">
                                       {typeof plan.features[label] === 'boolean' ? (
                                           plan.features[label] ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-muted-foreground/50" />
                                       ) : (
                                            plan.features[label] === 'Unlimited' ? <Infinity className="h-6 w-6 text-primary"/> : <span className="font-bold text-lg">{plan.features[label]}</span>
                                       )}
                                   </li>
                               ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
