
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteAllData } from '@/app/actions/admin-actions';

const CONFIRMATION_PHRASE = 'DELETE ALL DATA';

export default function AdminSettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { toast } = useToast();

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      const result = await deleteAllData();
      if (result.success) {
        toast({
          title: 'Platform Data Cleared',
          description: `Successfully deleted ${result.deletedUsers} users and all associated data. The page will now reload.`,
        });
        // Reload to reflect the cleared state
        setTimeout(() => window.location.reload(), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Clearing Data',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Admin Settings</h1>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These are highly destructive actions that can result in permanent data loss. Proceed with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-destructive/10 rounded-md gap-4">
            <div className="flex-1">
              <p className="font-semibold">Clear All Platform Data</p>
              <p className="text-sm text-destructive">
                This will permanently delete every user, class, student, marketplace product, and all other records from the entire platform.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full md:w-auto">Delete Everything</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is your final confirmation. This action will wipe the entire database and is irreversible.
                    <br /><br />
                    To proceed, please type{' '}
                    <strong className="text-foreground">{CONFIRMATION_PHRASE}</strong> into the box below.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-2">
                  <Input
                    id="delete-confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={`Type "${CONFIRMATION_PHRASE}"`}
                    autoComplete="off"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleClearAllData}
                    disabled={isClearing || confirmationText !== CONFIRMATION_PHRASE}
                  >
                    {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, Delete All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
