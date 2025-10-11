
'use client';
import { useState, useContext, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clipboard, Loader2, AlertTriangle, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function SettingsPage() {
    const { settings, setSettings, isLoading: isLoadingSettings } = useContext(SettingsContext);
    const { firestore, storage, user } = useFirebase();
    
    const [previewLogo, setPreviewLogo] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const { toast } = useToast();

    const CONFIRMATION_PHRASE = 'DELETE';

    useEffect(() => {
        if (settings?.schoolLogo) {
            setPreviewLogo(settings.schoolLogo);
        }
    }, [settings?.schoolLogo]);
    
    useEffect(() => {
        if (!isAlertOpen) {
            setConfirmationText('');
        }
    }, [isAlertOpen]);
    
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setLogoFile(file);
            const logoUrl = URL.createObjectURL(file);
            setPreviewLogo(logoUrl);
        }
    };


    const handleCopyCode = () => {
        if (settings?.userCode) {
            navigator.clipboard.writeText(settings.userCode);
            toast({
                title: 'Copied to Clipboard',
                description: 'Your user code has been copied.',
            });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings({[id]: value});
    };
    
    const handleSelectChange = (id: string, value: string) => {
        setSettings({[id]: value});
    };

    const uploadFile = useCallback((file: File, path: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!storage) {
                return reject(new Error("Firebase Storage is not available."));
            }
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                null,
                (error) => {
                    console.error("Upload failed:", error);
                    toast({
                        variant: "destructive",
                        title: "File Upload Failed",
                        description: `Could not upload ${file.name}. Please try again.`,
                    });
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }, [storage, toast]);
    
    const handleSaveChanges = async () => {
        if (!user || !settings) return;

        setIsSaving(true);
        
        try {
            const updates = { ...settings };
            const uploadPromises: Promise<void>[] = [];
            
            if (logoFile) {
                const logoPath = `school-logos/${user.uid}/${logoFile.name}`;
                uploadPromises.push(
                    uploadFile(logoFile, logoPath).then(url => {
                        updates.schoolLogo = url;
                    })
                );
            }

            await Promise.all(uploadPromises);

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, updates);
            
            setSettings(updates);

            toast({
                title: 'Settings Saved',
                description: 'Your changes have been saved successfully.',
            });

        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setIsSaving(false);
            setLogoFile(null);
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
            'outgoingTransfers'
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
            
            setSettings({ studentCounter: 0 });

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

    const isLoading = isLoadingSettings || !settings;

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
                        <Label>School Logo</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <Avatar className="h-24 w-24 rounded-md">
                                <AvatarImage src={previewLogo} className="object-contain"/>
                                <AvatarFallback className="rounded-md">
                                    <School className="h-10 w-10 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="w-full" disabled={isSaving} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={settings?.name || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" value={settings?.schoolName || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolMotto">School Motto</Label>
                        <Input id="schoolMotto" value={settings?.schoolMotto || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolAddress">School Address</Label>
                        <Input id="schoolAddress" value={settings?.schoolAddress || ''} onChange={handleInputChange} disabled={isSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={settings?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user-code">Your User Code</Label>
                        <div className="flex items-center gap-2">
                        <Input id="user-code" value={settings?.userCode || ''} readOnly />
                        <Button variant="outline" size="icon" onClick={handleCopyCode}>
                            <Clipboard className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
            </CardFooter>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Settings</CardTitle>
          <CardDescription>Set the current term and session for new records.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current-term">Current Term</Label>
            <Select value={settings?.currentTerm || ''} onValueChange={(value) => handleSelectChange('currentTerm', value)} disabled={isSaving}>
              <SelectTrigger id="current-term">
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
            <Input id="currentSession" value={settings?.currentSession || ''} onChange={handleInputChange} disabled={isSaving}/>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Academic Settings'}
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
