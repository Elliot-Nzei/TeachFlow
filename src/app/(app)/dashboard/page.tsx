
'use client';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, ClipboardList, ArrowRightLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useCollection, useFirebase, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Grade, DataTransfer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<any>(userProfileQuery);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);

  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection(classesQuery);
  
  const subjectsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'subjects')) : null, [firestore, user]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection(subjectsQuery);

  const gradesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'grades')) : null, [firestore, user]);
  const { data: grades, isLoading: isLoadingGrades } = useCollection<Grade>(gradesQuery);
  
  const sentTransfersQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'transfers'), orderBy('timestamp', 'desc')) : null,
    [firestore, user]
  );
  const { data: sentTransfers, isLoading: isLoadingSent } = useCollection<DataTransfer>(sentTransfersQuery);

  const receivedTransfersQuery = useMemoFirebase(
    () => {
      if (!user || !userProfile?.userCode) return null;
      return query(
        collection(firestore, 'transfers'), 
        where('toUser', '==', userProfile.userCode),
        orderBy('timestamp', 'desc')
      );
    },
    [firestore, user, userProfile?.userCode]
  );
  const { data: receivedTransfers, isLoading: isLoadingReceived } = useCollection<DataTransfer>(receivedTransfersQuery);
  
  const allTransfers = useMemo(() => {
    if (!sentTransfers && !receivedTransfers) return [];
    
    const combined = [
      ...(sentTransfers || []).map(t => ({...t, id: t.id ?? Math.random().toString()})),
      ...(receivedTransfers || []).map(t => ({...t, id: t.id ?? Math.random().toString()}))
    ];
    
    const uniqueTransfers = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    uniqueTransfers.sort((a, b) => {
        const timeA = a.timestamp?.seconds ?? 0;
        const timeB = b.timestamp?.seconds ?? 0;
        return timeB - timeA;
    });
    
    return uniqueTransfers;
  }, [sentTransfers, receivedTransfers]);

  const isLoadingTransfers = isLoadingSent || isLoadingReceived || isLoadingProfile;
  
  const gradeCounts = useMemo(() => (grades || []).reduce((acc, grade) => {
    acc[grade.grade] = (acc[grade.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [grades]);
  
  const chartData = useMemo(() => [
    { grade: "A", count: gradeCounts['A'] || 0 },
    { grade: "B", count: gradeCounts['B'] || 0 },
    { grade: "C", count: gradeCounts['C'] || 0 },
    { grade: "D", count: gradeCounts['D'] || 0 },
    { grade: "F", count: gradeCounts['F'] || 0 },
  ], [gradeCounts]);

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const stats = [
    { title: 'Total Students', value: students?.length, isLoading: isLoadingStudents, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Classes', value: classes?.length, isLoading: isLoadingClasses, icon: <ClipboardList className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Subjects', value: subjects?.length, isLoading: isLoadingSubjects, icon: <BookOpen className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Data Transfers', value: allTransfers.length, isLoading: isLoadingTransfers, icon: <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {stat.isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : (
                <div className="text-2xl font-bold">{stat.value ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Data Transfers</CardTitle>
               <CardDescription>A log of your recent data transfers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTransfers ? (
                    Array.from({length: 3}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : allTransfers.length > 0 ? (
                    allTransfers.slice(0, 5).map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="font-medium">{transfer.dataType}</div>
                          <div className="text-sm text-muted-foreground">
                            {transfer.fromUser === userProfile?.userCode ? `To: ${transfer.toUser}` : `From: ${transfer.fromUser}`}
                          </div>
                        </TableCell>
                        <TableCell>{transfer.dataTransferred ?? 'N/A'}</TableCell>
                        <TableCell className="text-right">{transfer.timestamp ? formatDistanceToNow(new Date(transfer.timestamp?.seconds * 1000), { addSuffix: true }) : 'just now'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                      <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                          No data transfers found.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Grades Summary</CardTitle>
              <CardDescription>Distribution of grades across all classes.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingGrades ? <Skeleton className="h-[200px] w-full" /> : (
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="grade"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value}
                        />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
