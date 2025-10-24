
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteAllData } from '@/app/actions/admin-actions';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function SystemPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user: adminUser } = useUser();

  const CONFIRMATION_PHRASE = 'DELETE ALL DATA';

  const handleOpenDialog = () => {
    setConfirmationText('');
    setIsAlertOpen(true);
  };

  const handleCloseDialog = () => {
    if (!isDeleting) {
      setIsAlertOpen(false);
      setConfirmationText('');
    }
  };

  const handleResetApplication = async () => {
    if (confirmationText !== CONFIRMATION_PHRASE) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Failed',
        description: 'You must type the confirmation phrase correctly to proceed.',
      });
      return;
    }
    if (!adminUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Could not identify the administrator. Please log in again.',
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      toast({
        title: 'Deletion in Progress...',
        description: 'This may take a few moments. Please do not navigate away.',
        duration: 10000,
      });

      const result = await deleteAllData(adminUser.uid);

      if (result.success) {
        toast({
          title: 'Application Reset Successful',
          description: `${result.deletedUsers || 0} user(s) and all associated data have been permanently deleted. You will be logged out.`,
          duration: 10000,
        });
        
        setIsAlertOpen(false);
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        throw new Error(result.error || 'An unexpected error occurred.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        duration: 10000,
      });
      setIsDeleting(false);
      setIsAlertOpen(false);
      setConfirmationText('');
    }
  };

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleResetApplication();
  };

  const isConfirmationValid = confirmationText === CONFIRMATION_PHRASE;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          System Management
        </h1>
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
          <div className="space-y-4">
            <p className="text-sm font-medium">
              This is the point of no return. This action is irreversible and will restore the application to a completely empty state. Your administrator account will be preserved but all its data will be cleared.
            </p>

            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-destructive">Warning: This will delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>All user accounts (except your own)</li>
                    <li>All school data, classes, students, and grades</li>
                    <li>All marketplace products and parent accounts</li>
                    <li>Everything else in the database</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleOpenDialog}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Initiate Full System Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={handleCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Final Confirmation: Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to delete ALL data except for your own admin account. This action cannot be undone.
              </p>
              <p>
                To proceed, type the following phrase exactly as it appears:
              </p>
              <strong className="block text-center font-mono my-2 p-2 bg-muted rounded-md text-foreground select-all">
                {CONFIRMATION_PHRASE}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type the phrase to confirm"
              disabled={isDeleting}
              className={confirmationText && !isConfirmationValid ? 'border-destructive' : ''}
              autoFocus
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-destructive mt-2">
                The phrase doesn't match. Please type it exactly.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={handleCloseDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmClick}
              disabled={isDeleting || !isConfirmationValid}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Everything...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  I Understand, Delete All Data
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
