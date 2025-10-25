
'use client';
import { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clipboard, Loader2, AlertTriangle, School, Save, Home, Phone, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFirebase, useStorage } from '@/firebase';
import { collection, writeBatch, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Textarea } from '@/components/ui/textarea';
import { nigerianStates } from '@/lib/nigerian-states';

export default function SettingsPage() {
    const { settings, setSettings: setContextSettings, isLoading: isLoadingSettings } = useContext(SettingsContext);
    const { firestore, user } = useFirebase();
    const storage = useStorage();
    
    const [localSettings, setLocalSettings] = useState(settings);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [hasLogoChanged, setHasLogoChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const { toast } = useToast();

    const CONFIRMATION_PHRASE = 'DELETE';

    // Initialize local settings only once when settings load
    useEffect(() => {
        if (settings && !localSettings) {
            setLocalSettings(settings);
            if (settings.schoolLogo) {
                setPreviewLogo(settings.schoolLogo);
            }
        }
    }, [settings, localSettings]);
    
    // Reset confirmation text when dialog closes
    useEffect(() => {
        if (!isAlertOpen) {
            setConfirmationText('');
        }
    }, [isAlertOpen]);

    const handleCopyCode = async () => {
        if (!settings?.userCode) return;

        try {
            await navigator.clipboard.writeText(settings.userCode);
            toast({
                title: 'Copied!',
                description: 'Your user code has been copied to clipboard.',
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Copy Failed',
                description: 'Could not copy the code to your clipboard.',
            });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => prev ? {...prev, [id]: value} : null);
    };

    const handleShippingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => prev ? {
            ...prev,
            shippingAddress: {
                ...(prev.shippingAddress || {}),
                [id]: value
            }
        } : null);
    };

    const handleShippingSelectChange = (id: string, value: string) => {
        setLocalSettings(prev => prev ? {
            ...prev,
            shippingAddress: {
                ...(prev.shippingAddress || {}),
                [id]: value
            }
        } : null);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File',
                    description: 'Please select an image file.',
                });
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'File Too Large',
                    description: 'Please select an image smaller than 2MB.',
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewLogo(reader.result as string);
                setHasLogoChanged(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setPreviewLogo(null);
        setHasLogoChanged(true);
    };
    
    const handleSaveLogo = async () => {
        if (!user) {
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'You must be logged in.' 
            });
            return;
        }

        if (!hasLogoChanged) {
            toast({ 
                title: 'No Changes', 
                description: 'No new logo to save.' 
            });
            return;
        }

        if (!storage) {
            toast({ 
                variant: 'destructive', 
                title: 'Storage Error', 
                description: 'Firebase Storage is not available.' 
            });
            return;
        }

        setIsSavingLogo(true);
        
        try {
            let downloadURL: string | null = null;

            if (previewLogo && previewLogo.startsWith('data:')) {
                // Upload new logo
                const storageRef = ref(storage, `users/${user.uid}/logos/school_logo_${Date.now()}.png`);
                await uploadString(storageRef, previewLogo, 'data_url');
                downloadURL = await getDownloadURL(storageRef);
            }

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { schoolLogo: downloadURL || '' });
            
            // Update both context and local state
            setContextSettings({ schoolLogo: downloadURL || '' });
            setLocalSettings(prev => prev ? { ...prev, schoolLogo: downloadURL || '' } : null);
            setHasLogoChanged(false);

            toast({ 
                title: 'Logo Updated', 
                description: downloadURL ? 'Your school logo has been saved.' : 'Your logo has been removed.' 
            });

        } catch (error) {
            console.error("Error saving logo:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Logo Save Failed', 
                description: 'Could not save your logo. Please try again.' 
            });
        } finally {
            setIsSavingLogo(false);
        }
    };

    const handleSelectChange = (id: string, value: string) => {
        setLocalSettings(prev => prev ? {...prev, [id]: value} : null);
    };
    
    const handleSaveChanges = async () => {
        if (!user || !localSettings) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Cannot save settings at this time.',
            });
            return;
        }

        setIsSaving(true);
        
        try {
            // Don't send schoolLogo in this update (it's handled separately)
            const { schoolLogo, userCode, email, ...settingsToSave } = localSettings;

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, settingsToSave);
            
            // Update context with all settings including unchanged ones
            setContextSettings({ ...localSettings });

            toast({
                title: 'Settings Saved',
                description: 'Your changes have been saved successfully.',
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Save Failed', 
                description: 'Could not save your settings. Please try again.' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearAllData = async () => {
        if (!user) {
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'You must be logged in to perform this action.' 
            });
            return;
        }

        if (confirmationText !== CONFIRMATION_PHRASE) {
            toast({
                variant: 'destructive',
                title: 'Confirmation Failed',
                description: `Please type "${CONFIRMATION_PHRASE}" to confirm.`,
            });
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
            let totalDeleted = 0;

            for (const collectionName of collectionsToDelete) {
                const collRef = collection(firestore, 'users', user.uid, collectionName);
                const snapshot = await getDocs(collRef);
                snapshot.forEach(docSnap => {
                    batch.delete(docSnap.ref);
                    totalDeleted++;
                });
            }
            
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { 
                studentCounter: 0,
                updatedAt: new Date(),
            });

            await batch.commit();

            // Clear localStorage
            try {
                localStorage.removeItem('lessonNotesHistory');
            } catch (e) {
                console.warn('Could not clear localStorage:', e);
            }
            
            setContextSettings({ studentCounter: 0 });

            toast({
                title: 'Data Cleared',
                description: `Successfully deleted ${totalDeleted} records.`,
                duration: 5000,
            });

            // Close dialog and reset
            setIsAlertOpen(false);
            setConfirmationText('');

            // Reload page after a delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Error clearing data:", error);
            toast({
                variant: 'destructive',
                title: 'Error Clearing Data',
                description: error instanceof Error ? error.message : 'Could not clear all data. Please try again.',
            });
        } finally {
            setIsClearing(false);
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
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and application preferences.</p>
            </div>

            {/* School Logo Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" />
                        School Logo
                    </CardTitle>
                    <CardDescription>Upload or update your school logo (Max 2MB, PNG, JPG, or JPEG).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-2">
                                <AvatarImage src={previewLogo || undefined} alt="School Logo" />
                                <AvatarFallback className="text-2xl">
                                    <School className="h-10 w-10 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            {previewLogo && (
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={handleRemoveLogo}
                                    disabled={isSavingLogo}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="logo-upload">Upload Logo</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    disabled={isSavingLogo}
                                    className="cursor-pointer"
                                />
                                <Button
                                    onClick={handleSaveLogo}
                                    disabled={!hasLogoChanged || isSavingLogo}
                                    variant="default"
                                >
                                    {isSavingLogo ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Save Logo
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile & School Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile & School Information</CardTitle>
                    <CardDescription>Update your personal and school details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                                id="name" 
                                value={localSettings?.name || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolName">School Name</Label>
                            <Input 
                                id="schoolName" 
                                value={localSettings?.schoolName || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolMotto">School Motto</Label>
                            <Input 
                                id="schoolMotto" 
                                value={localSettings?.schoolMotto || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolAddress">School Address</Label>
                            <Input 
                                id="schoolAddress" 
                                value={localSettings?.schoolAddress || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                value={localSettings?.email || ''} 
                                disabled 
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-code">Your User Code</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="user-code" 
                                    value={localSettings?.userCode || ''} 
                                    readOnly 
                                    className="bg-muted font-mono"
                                />
                                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                                    <Clipboard className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
      
            {/* Shipping Address */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5"/> 
                        Default Shipping Address
                    </CardTitle>
                    <CardDescription>Set your default delivery address for marketplace purchases.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Textarea 
                            id="address" 
                            placeholder="e.g., 123 Main Street, Ikeja" 
                            value={localSettings?.shippingAddress?.address || ''} 
                            onChange={handleShippingInputChange} 
                            disabled={isSaving}
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Select 
                                value={localSettings?.shippingAddress?.state || ''} 
                                onValueChange={(value) => handleShippingSelectChange('state', value)} 
                                disabled={isSaving}
                            >
                                <SelectTrigger id="state">
                                    <SelectValue placeholder="Select your state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {nigerianStates.map(state => (
                                        <SelectItem key={state} value={state}>{state}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="landmark">Nearest Landmark</Label>
                            <Input 
                                id="landmark" 
                                placeholder="e.g., Near Zenith Bank" 
                                value={localSettings?.shippingAddress?.landmark || ''} 
                                onChange={handleShippingInputChange} 
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4"/> 
                            Contact Phone Number
                        </Label>
                        <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="e.g., 08012345678" 
                            value={localSettings?.shippingAddress?.phone || ''} 
                            onChange={handleShippingInputChange} 
                            disabled={isSaving}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Set application-wide preferences for your account.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentTerm">Current Term</Label>
                        <Select 
                            value={localSettings?.currentTerm || ''} 
                            onValueChange={(value) => handleSelectChange('currentTerm', value)} 
                            disabled={isSaving}
                        >
                            <SelectTrigger id="currentTerm">
                                <SelectValue placeholder="Select term" />
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
                        <Input 
                            id="currentSession" 
                            value={localSettings?.currentSession || ''} 
                            onChange={handleInputChange} 
                            placeholder="e.g., 2024/2025" 
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="reportCardTemplate">Report Card Template</Label>
                        <Select 
                            value={localSettings?.reportCardTemplate || 'classic'} 
                            onValueChange={(value) => handleSelectChange('reportCardTemplate', value)} 
                            disabled={isSaving}
                        >
                            <SelectTrigger id="reportCardTemplate">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="modern">Modern</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="minimal-compact">Minimal Compact</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save All Settings
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        These actions are permanent and cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-destructive/10 rounded-md border border-destructive/20">
                        <div className="flex-1">
                            <p className="font-semibold">Clear All School Data</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete all classes, students, grades, and other records.
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            onClick={() => setIsAlertOpen(true)}
                            className="w-full sm:w-auto"
                        >
                            Clear All Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Clear Data Confirmation Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                This action is <strong>irreversible</strong>. All of your school data will be permanently deleted:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li>All classes and subjects</li>
                                <li>All student records</li>
                                <li>All grades and attendance</li>
                                <li>All transfers and payments</li>
                                <li>All timetables</li>
                            </ul>
                            <p className="pt-2">
                                This data <strong>cannot be recovered</strong>. Please type{' '}
                                <strong className="text-foreground font-mono">{CONFIRMATION_PHRASE}</strong> to confirm.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Input
                            id="delete-confirmation"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder={`Type "${CONFIRMATION_PHRASE}" to confirm`}
                            autoComplete="off"
                            className={confirmationText && confirmationText !== CONFIRMATION_PHRASE ? 'border-destructive' : ''}
                        />
                        {confirmationText && confirmationText !== CONFIRMATION_PHRASE && (
                            <p className="text-xs text-destructive mt-2">
                                Please type exactly "{CONFIRMATION_PHRASE}"
                            </p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleClearAllData}
                            disabled={isClearing || confirmationText !== CONFIRMATION_PHRASE}
                        >
                            {isClearing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Yes, Delete Everything'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
