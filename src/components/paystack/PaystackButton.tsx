
'use client';

import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toTitleCase } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

interface PaystackButtonProps {
  email: string;
  amount: number;
  onSuccess: (reference: { reference: string }) => void;
  onClose: () => void;
  planName?: string;
  isCurrentPlan?: boolean;
  isSubscriptionExpired?: boolean;
  billingCycle?: 'monthly' | 'annually';
  getButtonText?: (planId: string, planName: string, isCurrentPlan: boolean) => string;
  planId?: string;
  isPurchase?: boolean;
}

const PaystackButton: React.FC<PaystackButtonProps> = ({ 
    email, 
    amount, 
    onSuccess, 
    onClose, 
    planName, 
    isCurrentPlan, 
    isSubscriptionExpired, 
    getButtonText, 
    planId,
    isPurchase = false,
}) => {
  const { toast } = useToast();
  const initializePayment = usePaystackPayment({
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  });

  const handlePayment = () => {
    initializePayment({
      onSuccess,
      onClose,
      config: {
        email,
        amount: amount * 100, // Amount in kobo
        currency: 'NGN',
      },
    });
  };

  if (isPurchase) {
      return (
          <Button onClick={handlePayment} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" /> Buy Now
          </Button>
      )
  }

  return (
    <Button
      className="w-full"
      variant={isCurrentPlan && !isSubscriptionExpired ? 'outline' : 'default'}
      disabled={(isCurrentPlan && !isSubscriptionExpired) || planId === 'free_trial'}
      onClick={handlePayment}
    >
      {getButtonText && planId && planName && isCurrentPlan !== undefined
       ? getButtonText(planId, planName, isCurrentPlan)
       : 'Pay Now'}
    </Button>
  );
};

export default PaystackButton;
