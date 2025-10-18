
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free Plan',
    price: '₦0',
    description: 'Perfect for getting started and managing a small classroom.',
    features: [
      'Up to 25 Students',
      'Up to 5 Classes',
      'Basic Gradebook',
      'AI Lesson Note Generator (3 per month)',
      'Community Support',
    ],
    isFeatured: false,
    buttonLabel: 'Your Current Plan',
    buttonVariant: 'outline',
  },
  {
    name: 'Basic Plan',
    price: '₦5,000',
    description: 'Ideal for individual teachers managing multiple classes.',
    features: [
      'Up to 150 Students',
      'Up to 20 Classes',
      'Full Gradebook & Reporting',
      'AI Report Card Generator',
      'AI Lesson Note Generator (Unlimited)',
      'AI Exam Question Generator',
      'Email & Chat Support',
    ],
    isFeatured: true,
    buttonLabel: 'Upgrade to Basic',
    buttonVariant: 'default',
  },
  {
    name: 'Prime Plan',
    price: '₦12,000',
    description: 'For power users or small schools needing full capabilities.',
    features: [
      'Unlimited Students',
      'Unlimited Classes',
      'All features from Basic Plan',
      'Data Transfer between Users',
      'Data Export/Import',
      'Priority Support',
    ],
    isFeatured: false,
    buttonLabel: 'Upgrade to Prime',
    buttonVariant: 'default',
  },
];

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">Find the perfect plan</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Choose the plan that best fits your school's needs and unlock powerful features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              'flex flex-col',
              plan.isFeatured && 'border-primary ring-2 ring-primary shadow-lg'
            )}
          >
            <CardHeader className="text-center">
              {plan.isFeatured && (
                  <div className="mb-4 text-sm font-bold text-primary">RECOMMENDED</div>
              )}
              <CardTitle className="text-2xl font-headline">{plan.name}</CardTitle>
              <CardDescription>
                <div className="flex justify-center items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> / month</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <p className="text-center text-sm text-muted-foreground h-10">{plan.description}</p>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.buttonVariant as any}
                disabled={plan.buttonLabel === 'Your Current Plan'}
              >
                {plan.buttonLabel}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
