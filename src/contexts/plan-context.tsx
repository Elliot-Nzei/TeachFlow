
'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { SettingsContext } from './settings-context';
import type { User } from 'firebase/auth';

const TRIAL_DURATION_SECONDS = 30;

type Plan = 'free_trial' | 'basic' | 'prime' | null;

interface PlanContextType {
  plan: Plan;
  isTrial: boolean;
  isTrialExpired: boolean;
  trialTimeRemaining: number;
  isLocked: boolean;
  features: {
    canUseAdvancedAI: boolean;
    canUseDataTransfer: boolean;
    canUseSystemExport: boolean;
    studentLimit: number | 'Unlimited';
    classLimit: number | 'Unlimited';
  };
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useFirebase();
  const { settings, isLoading: isSettingsLoading } = useContext(SettingsContext);
  const pathname = usePathname();
  
  const [plan, setPlan] = useState<Plan>(null);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(TRIAL_DURATION_SECONDS);

  const trialStartedAt = settings?.trialStartedAt;

  useEffect(() => {
    if (isUserLoading || isSettingsLoading || !settings) {
        return;
    }
    setPlan(settings.plan || 'free_trial');
  }, [settings, isUserLoading, isSettingsLoading]);


  useEffect(() => {
    if (plan !== 'free_trial' || !trialStartedAt) {
      setTrialTimeRemaining(0);
      return;
    }

    const trialStartMs = trialStartedAt.toMillis();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const elapsedSeconds = Math.floor((nowMs - trialStartMs) / 1000);
      const remaining = TRIAL_DURATION_SECONDS - elapsedSeconds;
      setTrialTimeRemaining(remaining < 0 ? 0 : remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [plan, trialStartedAt]);
  
  const isTrialExpired = useMemo(() => {
    if (plan !== 'free_trial' || !trialStartedAt) return false;
    const trialStartMs = trialStartedAt.toMillis();
    const nowMs = Date.now();
    const elapsedSeconds = Math.floor((nowMs - trialStartMs) / 1000);
    return elapsedSeconds >= TRIAL_DURATION_SECONDS;
  }, [plan, trialStartedAt, trialTimeRemaining]); // Depends on trialTimeRemaining to re-evaluate
  
  const isLocked = useMemo(() => {
    // The app is locked if the trial is expired AND the user is not on the billing page.
    return isTrialExpired && pathname !== '/billing';
  }, [isTrialExpired, pathname]);

  const features = useMemo(() => {
    switch (plan) {
      case 'prime':
        return {
          canUseAdvancedAI: true,
          canUseDataTransfer: true,
          canUseSystemExport: true,
          studentLimit: 'Unlimited' as const,
          classLimit: 'Unlimited' as const,
        };
      case 'basic':
        return {
          canUseAdvancedAI: true,
          canUseDataTransfer: false,
          canUseSystemExport: false,
          studentLimit: 150,
          classLimit: 'Unlimited' as const,
        };
      default: // free_trial or null
        return {
          canUseAdvancedAI: false,
          canUseDataTransfer: false,
          canUseSystemExport: false,
          studentLimit: 25,
          classLimit: 5,
        };
    }
  }, [plan]);

  const value: PlanContextType = {
    plan,
    isTrial: plan === 'free_trial',
    isTrialExpired,
    trialTimeRemaining,
    isLocked,
    features,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
