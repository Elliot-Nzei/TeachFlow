
'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { SettingsContext } from './settings-context';
import type { User } from 'firebase/auth';
import { add, differenceInDays, isAfter } from 'date-fns';
import { doc } from 'firebase/firestore';

const TRIAL_DURATION_SECONDS = 30;
const BASIC_MONTHLY_SECONDS = 45;
const BASIC_ANNUALLY_MINUTES = 1;
const PRIME_MONTHLY_MINUTES = 1;
const PRIME_ANNUALLY_MINUTES = 90;

type Plan = 'free_trial' | 'basic' | 'prime' | null;
type BillingCycle = 'monthly' | 'annually' | null;

interface PlanContextType {
  plan: Plan;
  isTrial: boolean;
  subscriptionCycle: BillingCycle;
  renewalDate: Date | null;
  daysRemaining: number;
  isLocked: boolean;
  isSubscriptionExpired: boolean;
  features: {
    canUseAdvancedAI: boolean;
    canUseDataTransfer: boolean;
    canUseSystemExport: boolean;
    studentLimit: number | 'Unlimited';
    classLimit: number | 'Unlimited';
    aiGenerations: number | 'Unlimited';
  };
  aiUsage: {
    reportCardGenerations: number;
    lessonNoteGenerations: number;
    examGenerations: number;
    usageCycleStartDate: Date | null;
  };
  incrementUsage: (featureType: 'reportCard' | 'lessonNote' | 'exam') => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading, firestore } = useFirebase();
  const { settings, isLoading: isSettingsLoading } = useContext(SettingsContext);
  const pathname = usePathname();
  
  const [plan, setPlan] = useState<Plan>(null);
  const [subscriptionCycle, setSubscriptionCycle] = useState<BillingCycle>(null);
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [aiUsage, setAiUsage] = useState({
    reportCardGenerations: 0,
    lessonNoteGenerations: 0,
    examGenerations: 0,
    usageCycleStartDate: null as Date | null,
  });

  useEffect(() => {
    // Set up a timer that updates the current time every second.
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up the timer when the component unmounts.
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (isUserLoading || isSettingsLoading || !settings) {
        return;
    }
    setPlan(settings.plan || 'free_trial');
    setSubscriptionCycle(settings.subscriptionCycle || null);
    if (settings.aiUsage) {
       setAiUsage({
            reportCardGenerations: settings.aiUsage.reportCardGenerations || 0,
            lessonNoteGenerations: settings.aiUsage.lessonNoteGenerations || 0,
            examGenerations: settings.aiUsage.examGenerations || 0,
            usageCycleStartDate: settings.aiUsage.usageCycleStartDate?.toDate() || new Date(),
       });
    }
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
        endDate = add(startDate, { seconds: TRIAL_DURATION_SECONDS });
    } else if (plan === 'basic') {
        if (subscriptionCycle === 'annually') {
            endDate = add(startDate, { minutes: BASIC_ANNUALLY_MINUTES });
        } else {
            endDate = add(startDate, { seconds: BASIC_MONTHLY_SECONDS });
        }
    } else { // prime
         if (subscriptionCycle === 'annually') {
            endDate = add(startDate, { minutes: PRIME_ANNUALLY_MINUTES });
        } else {
            endDate = add(startDate, { minutes: PRIME_MONTHLY_MINUTES });
        }
    }
    
    setRenewalDate(endDate);
    setDaysRemaining(differenceInDays(endDate, new Date()));

  }, [plan, subscriptionCycle, settings]);
  
  const isSubscriptionExpired = useMemo(() => {
    if (isSettingsLoading || isUserLoading || !renewalDate) return false;
    // Re-calculate whenever currentTime updates.
    return isAfter(currentTime, renewalDate);
  }, [renewalDate, isSettingsLoading, isUserLoading, currentTime]);
  
  const isLocked = useMemo(() => {
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
          aiGenerations: 'Unlimited' as const,
        };
      case 'basic':
        return {
          canUseAdvancedAI: true,
          canUseDataTransfer: false,
          canUseSystemExport: false,
          studentLimit: 150,
          classLimit: 'Unlimited' as const,
          aiGenerations: 15,
        };
      default: // free_trial or null
        return {
          canUseAdvancedAI: false,
          canUseDataTransfer: false,
          canUseSystemExport: false,
          studentLimit: 25,
          classLimit: 5,
          aiGenerations: 0,
        };
    }
  }, [plan]);

  const incrementUsage = (featureType: 'reportCard' | 'lessonNote' | 'exam') => {
    if (!user || plan !== 'basic') return;

    const fieldMap = {
        reportCard: 'reportCardGenerations',
        lessonNote: 'lessonNoteGenerations',
        exam: 'examGenerations',
    } as const;
    const fieldToIncrement = fieldMap[featureType];
    const newCount = aiUsage[fieldToIncrement] + 1;

    setAiUsage(prev => ({...prev, [fieldToIncrement]: newCount }));
    
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, {
        [`aiUsage.${fieldToIncrement}`]: newCount
    });
  };


  const value: PlanContextType = {
    plan,
    isTrial: plan === 'free_trial',
    subscriptionCycle,
    renewalDate,
    daysRemaining,
    isLocked,
    isSubscriptionExpired,
    features,
    aiUsage,
    incrementUsage,
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
