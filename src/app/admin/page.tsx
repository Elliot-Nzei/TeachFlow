
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShoppingCart, ArrowRight, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useFirebase, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [greeting, setGreeting] = useState('Welcome');

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'marketplace_products')) : null, [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);
  
  const recentUsersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5)) : null, [firestore]);
  const { data: recentUsers, isLoading: isLoadingRecentUsers } = useCollection(recentUsersQuery);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const isLoading = isLoadingUsers || isLoadingProducts || isLoadingRecentUsers;
  const filteredRecentUsers = recentUsers?.filter(u => u.id !== user?.uid);
  
  // Exclude the admin from the total user count
  const totalUserCount = users ? users.length - 1 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{greeting}, Administrator</h1>
        <p className="text-muted-foreground">Here's a summary of your application's status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total Users
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{totalUserCount >= 0 ? totalUserCount : 0}</div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>The total number of registered users on the platform (excluding admins).</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Marketplace Products
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{products?.length || 0}</div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>The total number of active products in the marketplace.</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <Link href="/admin/users" passHref>
              <Button variant="outline" className="w-full justify-between">
                Manage All Users
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
             <Link href="/admin/marketplace" passHref>
              <Button variant="outline" className="w-full justify-between">
                Manage Marketplace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Recently Joined Users
            </CardTitle>
            <CardDescription>A list of the newest members on TeachFlow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : (
                filteredRecentUsers && filteredRecentUsers.length > 0 ? (
                  filteredRecentUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={u.profilePicture} alt={u.name} />
                          <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.schoolName}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {u.createdAt ? formatDistanceToNow(u.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No new user registrations yet.</p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
