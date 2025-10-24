
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Search, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toTitleCase } from '@/lib/utils';
import { format } from 'date-fns';
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
import { useToast } from '@/hooks/use-toast';
import { changeUserPlan, changeUserRole, deleteUser } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type User = {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  plan: 'free_trial' | 'basic' | 'prime';
  role: 'admin' | 'teacher';
  planStartDate?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  profilePicture?: string;
};

export default function AdminUsersPage() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), orderBy('name', 'asc')) : null, 
    [firestore]
  );
  const { data: users, isLoading, error } = useCollection<User>(usersQuery);

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'role' | 'plan' | 'delete' | null;
    user: User | null;
    newValue: string;
  }>({ open: false, type: null, user: null, newValue: '' });

  const handleActionClick = (type: 'role' | 'plan' | 'delete', user: User) => {
    if (currentUser?.uid === user.id && (type === 'delete' || type === 'role')) {
        toast({
            variant: 'destructive',
            title: 'Action Not Allowed',
            description: 'You cannot modify your own account role or delete yourself.',
        });
        return;
    }
    setDialogState({
      open: true,
      type,
      user,
      newValue: type === 'role' ? user.role : type === 'plan' ? user.plan : '',
    });
  };

  const closeDialog = () => {
    if (!isSubmitting) {
      setDialogState({ open: false, type: null, user: null, newValue: '' });
    }
  };
  
  const handleDialogSubmit = async () => {
    if (!dialogState.user || !dialogState.type) return;

    setIsSubmitting(dialogState.user.id);
    let result: { success: boolean; error?: string } | undefined;

    try {
      if (dialogState.type === 'role') {
        result = await changeUserRole(dialogState.user.id, dialogState.newValue as 'admin' | 'teacher');
      } else if (dialogState.type === 'plan') {
        result = await changeUserPlan(dialogState.user.id, dialogState.newValue as 'free_trial' | 'basic' | 'prime');
      } else if (dialogState.type === 'delete') {
        result = await deleteUser(dialogState.user.id);
      }

      if (result?.success) {
        const actionType = dialogState.type === 'delete' ? 'deleted' : 'updated';
        toast({ 
          title: 'Success', 
          description: `User ${dialogState.user.name} has been ${actionType}.` 
        });
        closeDialog();
      } else {
        throw new Error(result?.error || 'An unknown error occurred.');
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error instanceof Error ? error.message : 'Could not complete the action.',
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const uniqueUsers = useMemo(() => {
    if (!users) return [];
    
    // Create a map to hold the most representative user for each email
    const userMap = new Map<string, User>();
    
    users.forEach(user => {
      if (!user.email) return; // Skip users without an email

      // Always prefer the currently logged-in admin if duplicates exist
      if(user.id === currentUser?.uid) {
         userMap.set(user.email, user);
         return;
      }
      
      const existingUser = userMap.get(user.email);
      // If no user exists for this email, or if the new one is more recent, add it.
      // We prioritize users with a `createdAt` timestamp.
      if (!existingUser || (user.createdAt && (!existingUser.createdAt || user.createdAt.toDate() > existingUser.createdAt.toDate()))) {
          userMap.set(user.email, user);
      }
    });

    return Array.from(userMap.values());
  }, [users, currentUser]);


  const filteredUsers = useMemo(() => {
    return uniqueUsers.filter(user => 
        user.id !== currentUser?.uid && (
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [uniqueUsers, searchQuery, currentUser]);


  const getPlanColor = (plan: string) => {
    if (plan === 'prime') return 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    if (plan === 'basic') return 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };
  
  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const UserActionsDropdown = ({ user }: { user: User }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(false);
              handleActionClick('role', user);
            }}
          >
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(false);
              handleActionClick('plan', user);
            }}
          >
            Change Plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(false);
              handleActionClick('delete', user);
            }}
            className="text-destructive"
          >
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderUserRow = (user: User) => (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profilePicture} alt={user.name} />
            <AvatarFallback>{user.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            <span className="font-medium">{user.name}</span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{user.schoolName}</TableCell>
      <TableCell className="hidden lg:table-cell">
        <Badge variant="outline" className={getPlanColor(user.plan)}>
          {toTitleCase(user.plan.replace('_', ' '))}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Badge variant="outline" className={getRoleColor(user.role)}>
          {toTitleCase(user.role)}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {user.createdAt ? format(user.createdAt.toDate(), 'PPP') : 'N/A'}
      </TableCell>
      <TableCell>
        <UserActionsDropdown user={user} />
      </TableCell>
    </TableRow>
  );

  const renderMobileUserCard = (user: User) => (
    <Card key={user.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback>{user.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <UserActionsDropdown user={user} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm"><b>School:</b> {user.schoolName}</div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getPlanColor(user.plan)}>
            {toTitleCase(user.plan.replace('_', ' '))}
          </Badge>
          <Badge variant="outline" className={getRoleColor(user.role)}>
            {toTitleCase(user.role)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">User Management</h1>
        <p className="text-muted-foreground">View and manage all users in the system.</p>
      </div>
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>All Users ({filteredUsers?.length || 0})</CardTitle>
                    <CardDescription>A list of all registered users on the TeachFlow platform.</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Error Loading Users</p>
                <p className="text-sm">{error.message}</p>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <>
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map(user => renderMobileUserCard(user))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">School</TableHead>
                      <TableHead className="hidden lg:table-cell">Plan</TableHead>
                      <TableHead className="hidden lg:table-cell">Role</TableHead>
                      <TableHead className="hidden lg:table-cell">Date Joined</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => renderUserRow(user))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={dialogState.open && dialogState.type === 'delete'} 
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. This will delete <b>{dialogState.user?.name}</b>'s account and all their associated school data from TeachFlow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDialogSubmit} 
              disabled={!!isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role/Plan Change Dialog */}
      <AlertDialog 
        open={dialogState.open && (dialogState.type === 'role' || dialogState.type === 'plan')} 
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change {dialogState.type === 'role' ? 'Role' : 'Plan'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select the new {dialogState.type} for <b>{dialogState.user?.name}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select 
              value={dialogState.newValue} 
              onValueChange={(value) => setDialogState(prev => ({...prev, newValue: value}))}
              disabled={!!isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dialogState.type === 'role' ? (
                  <>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="prime">Prime</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDialogSubmit} disabled={!!isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
