
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, ShoppingCart, ArrowRight, UserPlus, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { useFirebase, useUser, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';

interface UserData {
  id: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  schoolName?: string;
  role?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
}

interface ProductData {
  id: string;
  name?: string;
  price?: number;
  createdAt?: Timestamp;
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersThisWeek: number;
}

export default function AdminDashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [greeting, setGreeting] = useState('Welcome');
  const [error, setError] = useState<string | null>(null);

  const adminProfileQuery = useMemoFirebase(
    () => (firestore && user) ? doc(firestore, 'users', user.uid) : null,
    [firestore, user]
  );
  const { data: adminProfile, isLoading: isLoadingAdminProfile } = useDoc<UserData>(adminProfileQuery);

  // Queries
  const usersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'users')) : null,
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useCollection(usersQuery);

  const productsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'marketplace_products')) : null,
    [firestore]
  );
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useCollection(productsQuery);

  const recentUsersQuery = useMemoFirebase(
    () => firestore ? query(
      collection(firestore, 'users'),
      orderBy('createdAt', 'desc'),
      limit(5)
    ) : null,
    [firestore]
  );
  const { data: recentUsers, isLoading: isLoadingRecentUsers, error: recentUsersError } = useCollection(recentUsersQuery);

  // Set greeting based on time of day
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

  // Handle errors
  useEffect(() => {
    if (usersError || productsError || recentUsersError) {
      const errorMessage = usersError?.message || productsError?.message || recentUsersError?.message;
      setError(errorMessage || 'Failed to load dashboard data');
      console.error('Dashboard error:', { usersError, productsError, recentUsersError });
    }
  }, [usersError, productsError, recentUsersError]);

  // Calculate dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    if (!users) {
      return {
        totalUsers: 0,
        totalProducts: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        activeUsersThisWeek: 0
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter out admin users and calculate stats
    const regularUsers = users.filter((u: UserData) => u.role !== 'admin' && u.id !== user?.uid);

    const newUsersToday = regularUsers.filter((u: UserData) => {
      if (!u.createdAt) return false;
      const createdDate = u.createdAt.toDate();
      return createdDate >= todayStart;
    }).length;

    const newUsersThisWeek = regularUsers.filter((u: UserData) => {
      if (!u.createdAt) return false;
      const createdDate = u.createdAt.toDate();
      return createdDate >= weekStart;
    }).length;

    const activeUsersThisWeek = regularUsers.filter((u: UserData) => {
      if (!u.lastLogin) return false;
      const lastLoginDate = u.lastLogin.toDate();
      return lastLoginDate >= weekStart;
    }).length;

    return {
      totalUsers: regularUsers.length,
      totalProducts: products?.length || 0,
      newUsersToday,
      newUsersThisWeek,
      activeUsersThisWeek
    };
  }, [users, products, user?.uid]);

  // Filter recent users (exclude current admin)
  const filteredRecentUsers = useMemo(() => {
    if (!recentUsers) return [];
    return recentUsers
      .filter((u: UserData) => u.id !== user?.uid && u.role !== 'admin')
      .slice(0, 5);
  }, [recentUsers, user?.uid]);

  // Calculate growth percentage
  const userGrowthPercentage = useMemo(() => {
    if (stats.totalUsers === 0) return 0;
    return Math.round((stats.newUsersThisWeek / stats.totalUsers) * 100);
  }, [stats.totalUsers, stats.newUsersThisWeek]);

  const isLoading = isLoadingUsers || isLoadingProducts || isLoadingRecentUsers || isLoadingAdminProfile;
  const adminName = adminProfile?.name?.split(' ')[0] || 'Administrator';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline">{greeting}, {adminName}</h1>
        <p className="text-muted-foreground">
          Here's a summary of your application's status and recent activity.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Users
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered members
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Users This Week Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                New This Week
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.newUsersThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  {userGrowthPercentage > 0 && (
                    <span className="text-green-600">+{userGrowthPercentage}%</span>
                  )} growth rate
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Active Users
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.activeUsersThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marketplace Products Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Products
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  In marketplace
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Quick Actions & Recent Users */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users" passHref>
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage All Users
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/admin/marketplace" passHref>
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Manage Marketplace
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recently Joined Users Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Recently Joined Users
            </CardTitle>
            <CardDescription>
              {stats.newUsersToday > 0 
                ? `${stats.newUsersToday} new ${stats.newUsersToday === 1 ? 'user' : 'users'} today`
                : 'Newest members on TeachFlow'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))
              ) : filteredRecentUsers.length > 0 ? (
                filteredRecentUsers.map((u: UserData) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.profilePicture} alt={u.name || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {u.name || u.email || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.schoolName || 'No school specified'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {u.createdAt 
                        ? formatDistanceToNow(u.createdAt.toDate(), { addSuffix: true })
                        : 'Unknown'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No new user registrations yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
