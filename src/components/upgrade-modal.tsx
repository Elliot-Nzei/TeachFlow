
'use client';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Star, Zap } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function UpgradeModal() {
  const { isLocked } = usePlan();
  const { auth } = useFirebase();
  const router = useRouter();

  const handleGoToBilling = () => {
    router.push('/billing');
  };

  const handleLogout = async () => {
    if(auth) {
        await signOut(auth);
        router.push('/login');
    }
  };

  return (
    <Dialog open={isLocked}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} hideCloseButton>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Star className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Free Trial Expired</DialogTitle>
          <DialogDescription className="text-center">
            Your trial has ended. Please upgrade to a paid plan to restore full access to TeachFlow.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button onClick={handleGoToBilling} className="w-full">
            <Zap className="mr-2 h-4 w-4" />
            View Plans
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
