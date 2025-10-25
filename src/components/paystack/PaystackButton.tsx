
'use client';

import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface PaystackButtonProps {
  email: string;
  amount: number;
  onSuccess: (reference: { reference: string }) => void;
  onClose: () => void;
  isPurchase?: boolean;
  disabled?: boolean;
}

const PaystackButton: React.FC<PaystackButtonProps> = ({ 
    email, 
    amount, 
    onSuccess, 
    onClose, 
    isPurchase = false,
    disabled = false,
}) => {
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

  return (
    <Button onClick={handlePayment} className="w-full" disabled={disabled}>
      <ShoppingCart className="mr-2 h-4 w-4" /> 
      {isPurchase ? 'Pay Now' : 'Proceed to Payment'}
    </Button>
  );
};

export default PaystackButton;
