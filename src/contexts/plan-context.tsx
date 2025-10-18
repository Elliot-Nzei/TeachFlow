
'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { SettingsContext } from './settings-context';
import type { User } from 'firebase/auth';
import { add, differenceInDays } from 'date-fns';

const TRIAL_DURATION_DAYS = 30;

type Plan = 'free_trial' | 'basic' | 'prime' | null;
type BillingCycle = 'monthly' | 'annually' | null;

interface PlanContextType {
  plan: Plan;
  isTrial: boolean;
  subscriptionCycle: BillingCycle;
  renewalDate: Date | null;
  daysRemaining: number;
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
  const [subscriptionCycle, setSubscriptionCycle] = useState<BillingCycle>(null);
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (isUserLoading || isSettingsLoading || !settings) {
        return;
    }
    setPlan(settings.plan || 'free_trial');
    setSubscriptionCycle(settings.subscriptionCycle || null);
  }, [settings, isUserLoading, isSettingsLoading]);


  useEffect(() => {
    if (!settings || !plan) return;

    const startDate = settings.planStartDate?.toDate();
    if (!startDate) {
        setRenewalDate(null);
        setDaysRemaining(0);
        return;
    }

    let endDate: Date;

    if (plan === 'free_trial') {
        endDate = add(startDate, { days: TRIAL_DURATION_DAYS });
    } else {
        if (subscriptionCycle === 'annually') {
            endDate = add(startDate, { years: 1 });
        } else { // 'monthly' or default for paid
            endDate = add(startDate, { months: 1 });
        }
    }
    
    setRenewalDate(endDate);
    setDaysRemaining(differenceInDays(endDate, new Date()));

  }, [plan, subscriptionCycle, settings]);
  
  const isSubscriptionExpired = useMemo(() => {
    // Don't determine expiry until all data is loaded
    if (isSettingsLoading || isUserLoading) return false;

    // A plan is considered expired if there are negative days remaining.
    // A positive or zero value means it's still active today.
    return daysRemaining < 0;

  }, [daysRemaining, isSettingsLoading, isUserLoading]);
  
  const isLocked = useMemo(() => {
    // The app is locked if the subscription is expired AND the user is not on the billing page.
    return isSubscriptionExpired && pathname !== '/billing';
  }, [isSubscriptionExpired, pathname]);

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
    subscriptionCycle,
    renewalDate,
    daysRemaining,
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
