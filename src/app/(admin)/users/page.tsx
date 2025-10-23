
'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toTitleCase } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function AdminUsersPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<any>(userProfileQuery);
  
  const usersQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'users')) : null, [firestore, userProfile]);
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  const isLoading = isUserLoading || isLoadingProfile || isLoadingUsers;

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user =>
      user.name && user.email &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.schoolName && user.schoolName.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Manage Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Registered Users</CardTitle>
          <CardDescription>View and manage all users on the TeachFlow platform.</CardDescription>
          <div className="relative pt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or school..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              filteredUsers.map(user => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      <Badge variant={user.plan === 'free_trial' ? 'destructive' : 'default'}>
                        {toTitleCase(user.plan?.replace('_', ' ') || 'Free Trial')}
                      </Badge>
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>
                      <p className="text-muted-foreground">School</p>
                      <p className="font-medium">{user.schoolName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">{user.planStartDate?.toDate ? format(user.planStartDate.toDate(), 'PPP') : 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.schoolName}</TableCell>
                      <TableCell>
                        <Badge variant={user.plan === 'free_trial' ? 'destructive' : user.plan === 'prime' ? 'default' : 'secondary'}>
                          {toTitleCase(user.plan?.replace('_', ' ') || 'Free Trial')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.planStartDate?.toDate ? format(user.planStartDate.toDate(), 'PPP') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
