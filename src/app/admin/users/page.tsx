
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase/provider';
import { collection, orderBy, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { changeUserPlan, changeUserRole, deleteUser } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name', 'asc')) : null, [firestore]);
  const { data: users, isLoading, error } = useCollection<User>(usersQuery, { requiresAdmin: true });

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'role' | 'plan' | 'delete' | null;
    user: User | null;
    newValue: string;
  }>({ open: false, type: null, user: null, newValue: '' });

  const handleActionClick = (type: 'role' | 'plan' | 'delete', user: User) => {
    setDialogState({
      open: true,
      type,
      user,
      newValue: type === 'role' ? user.role : user.plan,
    });
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
        toast({ title: 'Success', description: `User ${dialogState.user.name} has been updated.` });
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
        setDialogState({ open: false, type: null, user: null, newValue: '' });
    }
  };

  const getPlanColor = (plan: string) => {
    if (plan === 'prime') return 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    if (plan === 'basic') return 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };
  
  const getRoleColor = (role: string) => {
     if (role === 'admin') return 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300';
     return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => handleActionClick('role', user)}>Change Role</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleActionClick('plan', user)}>Change Plan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleActionClick('delete', user)} className="text-destructive">
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">User Management</h1>
        <p className="text-muted-foreground">View and manage all users in the system.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users?.length || 0})</CardTitle>
          <CardDescription>A list of all registered users on the TeachFlow platform.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
           ) : (
            <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {users?.map(user => (
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleActionClick('role', user)}>Change Role</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleActionClick('plan', user)}>Change Plan</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => handleActionClick('delete', user)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                             <CardContent className="space-y-2">
                                <div className="text-sm"><b>School:</b> {user.schoolName}</div>
                                 <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getPlanColor(user.plan)}>{toTitleCase(user.plan.replace('_', ' '))}</Badge>
                                    <Badge variant="outline" className={getRoleColor(user.role)}>{toTitleCase(user.role)}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
                            {users?.map(user => renderUserRow(user))}
                        </TableBody>
                    </Table>
                </div>
            </>
           )}
        </CardContent>
      </Card>
      
       <AlertDialog open={dialogState.open && dialogState.type === 'delete'} onOpenChange={(open) => !open && setDialogState({open: false, type: null, user: null, newValue: ''})}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action is permanent and cannot be undone. This will delete <b>{dialogState.user?.name}</b>'s account and all their associated school data from TeachFlow.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDialogSubmit} disabled={!!isSubmitting}>
                        {isSubmitting ? 'Deleting...' : 'Delete User'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {dialogState.open && (dialogState.type === 'role' || dialogState.type === 'plan') && (
            <AlertDialog open={dialogState.open} onOpenChange={(open) => !open && setDialogState({open: false, type: null, user: null, newValue: ''})}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change {dialogState.type}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select the new {dialogState.type} for <b>{dialogState.user?.name}</b>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                     <div className="py-4">
                        <Select value={dialogState.newValue} onValueChange={(value) => setDialogState(prev => ({...prev, newValue: value}))}>
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
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDialogSubmit} disabled={!!isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </div>
  );
}
