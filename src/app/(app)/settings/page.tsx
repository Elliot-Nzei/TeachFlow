import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and application preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and the name of your school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-name">School Name</Label>
            <Input id="school-name" defaultValue="Sunshine Primary School" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" defaultValue="j.doe@example.com" disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="user-code">Your User Code</Label>
            <Input id="user-code" defaultValue="NSMS-53102" disabled />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Profile</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Settings</CardTitle>
          <CardDescription>Set the current term and session for new records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-term">Current Term</Label>
              <Select defaultValue="First Term">
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
              <Label htmlFor="current-session">Current Session</Label>
              <Input id="current-session" defaultValue="2023/2024" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Academic Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
