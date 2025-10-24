'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteAllData } from '@/app/actions/admin-actions';
import { useRouter } from 'next/navigation';

export default function SystemPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const CONFIRMATION_PHRASE = 'DELETE ALL DATA';

  const handleResetApplication = async () => {
    if (confirmationText !== CONFIRMATION_PHRASE) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Failed',
        description: 'You must type the confirmation phrase correctly to proceed.',
      });
      return;
    }
    
    setIsDeleting(true);
    toast({
      title: 'Deletion in Progress...',
      description: 'This may take a few moments. Please do not navigate away.',
      duration: 10000,
    });

    const result = await deleteAllData();

    if (result.success) {
      toast({
        title: 'Application Reset Successful',
        description: `${result.deletedUsers || 0} user(s) and all associated data have been permanently deleted. You will be logged out.`,
        duration: 10000,
      });
      // Redirect to login after a delay to allow the user to read the toast.
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } else {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: result.error || 'An unexpected error occurred.',
        duration: 10000,
      });
      setIsDeleting(false);
      setIsAlertOpen(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><AlertTriangle className="h-8 w-8 text-destructive" />System Management</h1>
        <p className="text-muted-foreground">Critical system-wide actions. Use with extreme caution.</p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Reset Application</CardTitle>
          <CardDescription>
            This action will permanently delete all data from the application, including all users, schools, classes, students, grades, and marketplace products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium mb-4">
            This is the point of no return. This action is irreversible and will restore the application to a completely empty state, as if it were just deployed. The only thing remaining will be your own administrator account after you re-register.
          </p>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Initiate Full System Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  Final Confirmation: Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to delete ALL data. To proceed, type the following phrase exactly as it appears:
                  <strong className="block text-center font-mono my-2 p-2 bg-muted rounded-md text-foreground">{CONFIRMATION_PHRASE}</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type the phrase to confirm"
                disabled={isDeleting}
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleResetApplication}
                  disabled={isDeleting || confirmationText !== CONFIRMATION_PHRASE}
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  {isDeleting ? 'Deleting Everything...' : 'I Understand, Delete All Data'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
