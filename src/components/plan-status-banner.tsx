'use client';
import { usePlan } from '@/contexts/plan-context';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PlanStatusBanner() {
  const { plan, isTrial, trialTimeRemaining, isTrialExpired } = usePlan();
  
  if (!plan) {
    return null; // Don't render anything if plan is not yet loaded
  }

  if (isTrial && !isTrialExpired) {
    return (
      <div className="bg-blue-600 text-white text-center text-sm py-1.5">
        Free Trial Active — Expires in {Math.max(0, trialTimeRemaining)} seconds. <Link href="/billing" className="underline font-bold">Upgrade Now</Link>
      </div>
    );
  }

  return (
      <div className="bg-primary text-primary-foreground text-center text-sm py-1.5">
        Current Plan: <Badge variant="secondary" className="ml-2">{plan}</Badge>
      </div>
  );
}