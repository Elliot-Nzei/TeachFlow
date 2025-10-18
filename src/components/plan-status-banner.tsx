
'use client';
import { usePlan } from '@/contexts/plan-context';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PlanStatusBanner() {
  const { plan, isTrial, trialTimeRemaining, isTrialExpired } = usePlan();
  
  if (!plan) {
    return null; // Don't render anything if plan is not yet loaded
  }

  const formatTime = (seconds: number) => {
    const clampedSeconds = Math.max(0, seconds);
    const minutes = Math.floor(clampedSeconds / 60);
    const remainingSeconds = clampedSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (isTrial && !isTrialExpired) {
    return (
      <div className="bg-blue-600 text-white text-center text-sm py-1.5">
        Free Trial Active — Expires in {formatTime(trialTimeRemaining)}. <Link href="/billing" className="underline font-bold">Upgrade Now</Link>
      </div>
    );
  }

  return (
      <div className="bg-primary text-primary-foreground text-center text-sm py-1.5">
        Current Plan: <Badge variant="secondary" className="ml-2">{plan}</Badge>
      </div>
  );
}

    