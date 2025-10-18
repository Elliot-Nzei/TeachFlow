'use client';
import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatabaseBackup, Upload, Loader2, AlertCircle, Lock } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SettingsContext } from '@/contexts/settings-context';
import { usePlan } from '@/contexts/plan-context';

type FullBackup = {
  version: string;
  exportedAt: string;
  data: {
    classes: any[];
    students: any[];
    subjects: any[];
    grades: any[];
    attendance: any[];
    traits: any[];
    payments: any[];
  };
};

export default function SystemPage() {
  const { firestore, user } = useFirebase();
  const { settings } = useContext(SettingsContext);
  const { features } = usePlan();
  const { toast } = useToast();
  const router = useRouter();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  useEffect(() => {
    if (!features.canUseSystemExport) {
        router.push('/billing');
        toast({
            variant: 'destructive',
            title: 'Upgrade Required',
            description: 'You need to upgrade to the Prime plan to access this page.'
        });
    }
  }, [features.canUseSystemExport, router, toast]);


  const collectionsToBackup = ['classes', 'students', 'subjects', 'grades', 'attendance', 'traits', 'payments'];

  const handleExportData = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to export data.' });
      return;
    }
    setIsExporting(true);
    toast({ title: 'Starting Export...', description: 'Gathering all your school data. This may take a moment.' });

    try {
      const backupData: FullBackup['data'] = {
        classes: [], students: [], subjects: [], grades: [], attendance: [], traits: [], payments: []
      };

      for (const collectionName of collectionsToBackup) {
        const collRef = collection(firestore, 'users', user.uid, collectionName);
        const snapshot = await getDocs(collRef);
        // We strip the ID from the documents, as they will be newly created on import.
        backupData[collectionName as keyof FullBackup['data']] = snapshot.docs.map(doc => doc.data());
      }
      
      const fullBackup: FullBackup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: backupData
      };

      const jsonString = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `TeachFlow_backup_${settings?.schoolName?.replace(/\s+/g, '_') || 'school'}_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Export Successful', description: 'Your data has been downloaded.' });

    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your data. Please check the console for details.' });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToImport(event.target.files[0]);
    }
  };

  const handleImportData = async () => {
    if (!fileToImport || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a backup file to import.' });
      return;
    }
    
    setIsImporting(true);
    toast({ title: 'Starting Import...', description: 'Please do not navigate away from this page.' });

    try {
      const fileContent = await fileToImport.text();
      const backup: FullBackup = JSON.parse(fileContent);

      if (backup.version !== '1.0' || !backup.data) {
        throw new Error('Invalid or corrupted backup file format.');
      }

      const batch = writeBatch(firestore);

      for (const collectionName of collectionsToBackup) {
        const dataArray = backup.data[collectionName as keyof FullBackup['data']];
        if (dataArray && dataArray.length > 0) {
            const collRef = collection(firestore, 'users', user.uid, collectionName);
            dataArray.forEach(itemData => {
                const newDocRef = doc(collRef);
                batch.set(newDocRef, itemData);
            });
        }
      }

      await batch.commit();

      toast({ title: 'Import Complete!', description: 'All data has been successfully restored. Please reload the page.' });

    } catch (error) {
        console.error('Import failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Import Failed', description: `Could not import data. Error: ${errorMessage}` });
    } finally {
        setIsImporting(false);
        setFileToImport(null);
    }
  };

  if (!features.canUseSystemExport) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2"><Lock className="h-5 w-5" /> Access Denied</CardTitle>
                    <CardDescription>This feature is available on the Prime plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Upgrade to the Prime plan to export and import your school data.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/billing')} className="w-full">View Plans</Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">System Data Management</h1>
        <p className="text-muted-foreground">Export your school data for backup or import it to a new account.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5" /> Export All Data
            </CardTitle>
            <CardDescription>
              Download a complete backup of all your school's data, including classes, students, grades, and more, into a single JSON file. This is useful for backups or migrating to a different account.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleExportData} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}
              {isExporting ? 'Exporting...' : 'Export Data as JSON'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import Data
            </CardTitle>
            <CardDescription>
              Restore your school's data from a previously exported JSON backup file. This will add the data to your current account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Importing data will add to any existing data in your account. It does not overwrite or delete. For a clean import, use a new account or clear all data from settings first.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="import-file">Backup File (.json)</Label>
                <Input id="import-file" type="file" accept=".json" onChange={handleFileChange} disabled={isImporting} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleImportData} disabled={!fileToImport || isImporting}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isImporting ? 'Importing...' : 'Upload and Import Data'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
