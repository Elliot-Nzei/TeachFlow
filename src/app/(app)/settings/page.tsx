'use client';
import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clipboard, User as UserIcon, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';

export default function SettingsPage() {
    const { settings, setSettings } = useContext(SettingsContext);
    const [previewImage, setPreviewImage] = useState(settings.profilePicture);
    const userCode = 'NSMS-53102';
    const { toast } = useToast();

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setPreviewImage(imageUrl);
        setSettings(prev => ({...prev, profilePicture: imageUrl}));
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(userCode);
        toast({
            title: 'Copied to Clipboard',
            description: 'Your user code has been copied.',
        });
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({...prev, [id]: value}));
    };
    
    const handleSelectChange = (id: string, value: string) => {
        setSettings(prev => ({...prev, [id]: value}));
    };
    
    const handleSaveChanges = () => {
        toast({
            title: 'Settings Saved',
            description: 'Your changes have been saved successfully.',
        });
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
                        <Input id="name" value={settings.name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" value={settings.schoolName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={settings.email} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user-code">Your User Code</Label>
                        <div className="flex items-center gap-2">
                        <Input id="user-code" value={userCode} readOnly />
                        <Button variant="outline" size="icon" onClick={handleCopyCode}>
                            <Clipboard className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
            <Button onClick={handleSaveChanges}>Save Profile</Button>
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
            <Select value={settings.currentTerm} onValueChange={(value) => handleSelectChange('currentTerm', value)}>
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
            <Input id="currentSession" value={settings.currentSession} onChange={handleInputChange} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges}>Save Academic Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
