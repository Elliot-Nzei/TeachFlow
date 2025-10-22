
'use client';
import { useState, useContext, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clipboard, Loader2, AlertTriangle, School, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFirebase, useStorage } from '@/firebase';
import { collection, writeBatch, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
    const { settings, setSettings: setContextSettings, isLoading: isLoadingSettings } = useContext(SettingsContext);
    const { firestore, user } = useFirebase();
    const storage = useStorage();
    
    const [localSettings, setLocalSettings] = useState(settings);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const { toast } = useToast();

    const CONFIRMATION_PHRASE = 'DELETE';

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
            setPreviewLogo(settings.schoolLogo || null);
        }
    }, [settings]);
    
    useEffect(() => {
        if (!isAlertOpen) {
            setConfirmationText('');
        }
    }, [isAlertOpen]);
    

    const handleCopyCode = async () => {
        if (!settings?.userCode) return;
        const textToCopy = settings.userCode;

        try {
            await navigator.clipboard.writeText(textToCopy);
            toast({
                title: 'Copied to Clipboard',
                description: 'Your user code has been copied.',
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Copy Failed',
                description: 'Could not copy the code to your clipboard.',
            });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => prev ? {...prev, [id]: value} : null);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveLogo = async () => {
        if (!user || !previewLogo || previewLogo === settings?.schoolLogo) {
            toast({ title: 'No Changes', description: 'No new logo to save.' });
            return;
        }

        if (!storage) {
            toast({ variant: 'destructive', title: 'Storage Error', description: 'Firebase Storage is not available.' });
            return;
        }

        setIsSavingLogo(true);
        try {
            const storageRef = ref(storage, `users/${user.uid}/logos/school_logo.png`);
            
            // The previewLogo is a data URL (e.g., "data:image/png;base64,...")
            // We need to upload it correctly.
            await uploadString(storageRef, previewLogo, 'data_url');
            
            const downloadURL = await getDownloadURL(storageRef);

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { schoolLogo: downloadURL });
            
            // Update context immediately to reflect the change
            setContextSettings({ schoolLogo: downloadURL });

            toast({ title: 'Logo Saved', description: 'Your new school logo has been saved.' });

        } catch (error) {
            console.error("Error saving logo:", error);
            toast({ variant: 'destructive', title: 'Logo Save Failed', description: 'Could not save your new logo.' });
        } finally {
            // CRITICAL: Always reset the saving state
            setIsSavingLogo(false);
        }
    };


    const handleSelectChange = (id: string, value: string) => {
        setLocalSettings(prev => prev ? {...prev, [id]: value} : null);
    };
    
    const handleSaveChanges = async () => {
        if (!user || !localSettings) return;
        setIsSaving(true);
        
        // Exclude logo from this update, as it's handled separately.
        const { schoolLogo, ...otherSettings } = localSettings;

        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, otherSettings);
            
            setContextSettings(otherSettings);

            toast({
                title: 'Settings Saved',
                description: 'Your changes have been saved successfully.',
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your settings.' });
        } finally {
            setIsSaving(false);
        }
    }


    const handleClearAllData = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to perform this action.' });
            return;
        }

        setIsClearing(true);

        const collectionsToDelete = [
            'classes', 
            'students', 
            'subjects', 
            'grades', 
            'attendance', 
            'traits',
            'incomingTransfers', 
            'outgoingTransfers',
            'payments',
            'timetables'
        ];

        try {
            const batch = writeBatch(firestore);

            for (const collectionName of collectionsToDelete) {
                const collRef = collection(firestore, 'users', user.uid, collectionName);
                const snapshot = await getDocs(collRef);
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }
            
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { studentCounter: 0 });

            await batch.commit();

            localStorage.removeItem('lessonNotesHistory');
            
            setContextSettings({ studentCounter: 0 });

            toast({
                title: 'Data Cleared',
                description: 'All your school data has been successfully deleted.',
            });

            window.location.reload();

        } catch (error) {
            console.error("Error clearing data:", error);
            toast({
                variant: 'destructive',
                title: 'Error Clearing Data',
                description: 'Could not clear all data. Please try again.',
            });
        } finally {
            setIsClearing(false);
            setIsAlertOpen(false);
        }
    };

    const isLoading = isLoadingSettings || !localSettings;

    if (isLoading) {
        return (
             <div className="space-y-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your profile and application preferences.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>School Information</CardTitle>
                        <CardDescription>Update your school's details and logo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center gap-6">
                            <Skeleton className="h-24 w-24 rounded-md" />
                            <div className="w-full max-w-sm space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                           <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                           <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                           <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                    </CardContent>
                </Card>
             </div>
        )
    }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and application preferences.</p>
      </div>

        <Card>
            <CardHeader>
            <CardTitle>Profile & School Information</CardTitle>
            <CardDescription>Update your personal and school details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Label>School Logo</Label>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <Avatar className="h-24 w-24 rounded-md">
                                <AvatarImage src={previewLogo || undefined} className="object-contain"/>
                                <AvatarFallback className="rounded-md">
                                    <School className="h-10 w-10 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange}/>
                                <p className="text-xs text-muted-foreground">Recommended: Square PNG/JPG.</p>
                                <Button onClick={handleSaveLogo} disabled={isSavingLogo} size="sm" className="w-fit">
                                    {isSavingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Logo
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={localSettings?.name || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" value={localSettings?.schoolName || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolMotto">School Motto</Label>
                        <Input id="schoolMotto" value={localSettings?.schoolMotto || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolAddress">School Address</Label>
                        <Input id="schoolAddress" value={localSettings?.schoolAddress || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={localSettings?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user-code">Your User Code</Label>
                        <div className="flex items-center gap-2">
                        <Input id="user-code" value={localSettings?.userCode || ''} readOnly />
                        <Button variant="outline" size="icon" onClick={handleCopyCode}>
                            <Clipboard className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Settings</CardTitle>
          <CardDescription>Set the current term and session for new records.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentTerm">Current Term</Label>
            <Select value={localSettings?.currentTerm || ''} onValueChange={(value) => handleSelectChange('currentTerm', value)} disabled={isSaving}>
              <SelectTrigger id="currentTerm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First Term">First Term</SelectItem>
                <SelectItem value="Second Term">Second Term</SelectItem>
                <SelectItem value="Third Term">Third Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentSession">Current Session</Label>
            <Input id="currentSession" value={localSettings?.currentSession || ''} onChange={handleInputChange} disabled={isSaving}/>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              These actions are permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-md">
              <div>
                <p className="font-semibold">Clear All School Data</p>
                <p className="text-sm text-destructive">This will permanently delete all your classes, students, grades, and other records.</p>
              </div>
              <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Clear All Data</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive" />
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible. All of your school data, including all classes, students, subjects, grades, attendance, and transfer history will be permanently deleted. This data cannot be recovered.
                       <br/><br/>
                       Please type <strong className="text-foreground">{CONFIRMATION_PHRASE}</strong> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-2">
                    <Input
                        id="delete-confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder={`Type "${CONFIRMATION_PHRASE}" to confirm`}
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
                      {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Yes, Delete Everything
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

    