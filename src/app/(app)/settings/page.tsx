
'use client';
import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clipboard, User as UserIcon, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
    const { settings, setSettings, isLoading } = useContext(SettingsContext);
    const { firestore, user } = useFirebase();
    const [previewImage, setPreviewImage] = useState('');
    const [isClearing, setIsClearing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (settings?.profilePicture) {
            setPreviewImage(settings.profilePicture);
        }
    }, [settings?.profilePicture]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
            // This is a temporary frontend update. The actual upload logic needs to be implemented.
            // For now, let's just update the local state.
            // In a real app, you would upload the file to Firebase Storage and get a URL.
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
    
    const handleSaveChanges = () => {
        // Here we would ideally check which fields have changed and save them.
        // The setSettings in context already handles the DB update.
        toast({
            title: 'Settings Saved',
            description: 'Your changes have been saved successfully.',
        });
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
            
            // Also reset the student counter in the main user document
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { studentCounter: 0 });

            await batch.commit();

            // Also clear local storage for things like lesson note history
            localStorage.removeItem('lessonNotesHistory');
            
            setSettings({ studentCounter: 0 });

            toast({
                title: 'Data Cleared',
                description: 'All your school data has been successfully deleted.',
            });

            // Consider reloading the page or redirecting to reflect the cleared state
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
        }
    };


    if (isLoading && !settings) {
        return (
             <div className="space-y-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your profile and application preferences.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your name, school, and profile picture.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center gap-6">
                            <Skeleton className="h-24 w-24 rounded-full" />
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
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name, school, and profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={previewImage} />
                        <AvatarFallback>
                            <UserIcon className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="picture">Profile Picture</Label>
                        <div className="flex items-center gap-2">
                             <Input id="picture" type="file" accept="image/*" onChange={handleImageUpload} className="w-full" />
                             <Button variant="outline" size="icon" asChild>
                                 <label htmlFor="picture" className="cursor-pointer">
                                     <Upload />
                                 </label>
                             </Button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={settings?.name || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" value={settings?.schoolName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolMotto">School Motto</Label>
                        <Input id="schoolMotto" value={settings?.schoolMotto || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolAddress">School Address</Label>
                        <Input id="schoolAddress" value={settings?.schoolAddress || ''} onChange={handleInputChange} />
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
            <Button onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Profile
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
            <Select value={settings?.currentTerm || ''} onValueChange={(value) => handleSelectChange('currentTerm', value)}>
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
            <Input id="currentSession" value={settings?.currentSession || ''} onChange={handleInputChange} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Academic Settings
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
              <AlertDialog>
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
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={handleClearAllData}
                      disabled={isClearing}
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
