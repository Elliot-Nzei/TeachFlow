
'use client';
import { useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, ClipboardList, UserPlus, Home, CalendarClock, DollarSign } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { SettingsContext } from '@/contexts/settings-context';
import type { Payment } from '@/lib/types';


export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { settings, isLoading: isLoadingSettings } = useContext(SettingsContext);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection(studentsQuery);

  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection(classesQuery);
  
  const subjectsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'subjects')) : null, [firestore, user]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection(subjectsQuery);

  const gradesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'grades')) : null, [firestore, user]);
  const { data: grades, isLoading: isLoadingGrades } = useCollection<any>(gradesQuery);
  
  const recentStudentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students'), orderBy('createdAt', 'desc'), limit(3)) : null, [firestore, user]);
  const { data: recentStudents, isLoading: isLoadingRecentStudents } = useCollection<any>(recentStudentsQuery);
  
  const recentClassesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes'), orderBy('createdAt', 'desc'), limit(2)) : null, [firestore, user]);
  const { data: recentClasses, isLoading: isLoadingRecentClasses } = useCollection<any>(recentClassesQuery);
  
  const paymentsQuery = useMemoFirebase(() => (user && settings?.currentTerm && settings?.currentSession) ? query(collection(firestore, 'users', user.uid, 'payments'), where('term', '==', settings.currentTerm), where('session', '==', settings.currentSession)) : null, [firestore, user, settings]);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
  

  const gradeCounts = useMemo(() => (grades || []).reduce((acc: Record<string, number>, grade: any) => {
    if (grade.grade) {
      acc[grade.grade] = (acc[grade.grade] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>), [grades]);
  
  const gradeChartData = useMemo(() => [
    { grade: "A", count: gradeCounts['A'] || 0 },
    { grade: "B", count: gradeCounts['B'] || 0 },
    { grade: "C", count: gradeCounts['C'] || 0 },
    { grade: "D", count: gradeCounts['D'] || 0 },
    { grade: "F", count: gradeCounts['F'] || 0 },
  ], [gradeCounts]);

  const gradeChartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const paymentSummary = useMemo(() => {
    if (!payments || !students) return { paid: 0, partially: 0, owing: 0, totalCollected: 0, totalOutstanding: 0 };

    let paid = 0;
    let partially = 0;
    let owing = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    const studentPaymentStatus: Record<string, 'paid' | 'partially' | 'owing'> = {};

    students.forEach(student => {
      const studentClass = classes?.find(c => c.id === student.classId);
      const feeDue = studentClass?.feeAmount || 0;
      const payment = payments.find(p => p.studentId === student.id);
      const amountPaid = payment?.amountPaid || 0;
      
      totalCollected += amountPaid;
      totalOutstanding += Math.max(0, feeDue - amountPaid);
      
      if (feeDue > 0) {
        if (amountPaid >= feeDue) {
            paid++;
        } else if (amountPaid > 0) {
            partially++;
        } else {
            owing++;
        }
      }
    });

    return { paid, partially, owing, totalCollected, totalOutstanding };
  }, [payments, students, classes]);

  const paymentChartData = [
    { status: 'Paid', count: paymentSummary.paid, fill: 'var(--color-paid)' },
    { status: 'Partially', count: paymentSummary.partially, fill: 'var(--color-partially)' },
    { status: 'Owing', count: paymentSummary.owing, fill: 'var(--color-owing)' },
  ];
  
  const paymentChartConfig = {
    count: { label: 'Students' },
    paid: { label: 'Paid', color: 'hsl(var(--chart-2))' },
    partially: { label: 'Partially', color: 'hsl(var(--chart-4))' },
    owing: { label: 'Owing', color: 'hsl(var(--chart-5))' },
  } satisfies ChartConfig;


  const stats = [
    { title: 'Total Students', value: students?.length, isLoading: isLoadingStudents, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Classes', value: classes?.length, isLoading: isLoadingClasses, icon: <ClipboardList className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Subjects', value: subjects?.length, isLoading: isLoadingSubjects, icon: <BookOpen className="h-4 w-4 text-muted-foreground" /> },
  ];

  return (
    <div className="space-y-6">
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Session</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? <Skeleton className="h-8 w-3/4 mt-1" /> : (
                <div className="text-xl font-bold">{settings?.currentTerm || 'N/A'}, {settings?.currentSession || 'N/A'}</div>
              )}
            </CardContent>
          </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Recently added students and classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center"><UserPlus className="mr-2 h-4 w-4" /> New Students</h3>
              <div className="space-y-4">
                {(isLoadingRecentStudents || !recentStudents) ? Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-12 w-full" />) :
                recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.className || 'Unassigned'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{student.createdAt ? formatDistanceToNow(student.createdAt.toDate(), {addSuffix: true}) : ''}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center"><Home className="mr-2 h-4 w-4" /> New Classes</h3>
                <div className="space-y-4">
                    {(isLoadingRecentClasses || !recentClasses) ? Array.from({length: 2}).map((_,i) => <Skeleton key={i} className="h-12 w-full" />) :
                    recentClasses.map((cls) => (
                        <div key={cls.id} className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-secondary">
                               <Home className="h-5 w-5 text-secondary-foreground" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{cls.name}</p>
                                <p className="text-xs text-muted-foreground">{cls.students?.length || 0} students</p>
                            </div>
                             <p className="text-xs text-muted-foreground">{cls.createdAt ? formatDistanceToNow(cls.createdAt.toDate(), {addSuffix: true}) : ''}</p>
                        </div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-6">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" />Payment Summary</CardTitle>
                <CardDescription>Overview of fee payments for the current term.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingPayments || isLoadingStudents ? <Skeleton className="h-[250px] w-full" /> : (
                <>
                    <ChartContainer config={paymentChartConfig} className="min-h-[250px] w-full">
                        <BarChart accessibilityLayer data={paymentChartData} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid horizontal={false} />
                            <YAxis dataKey="status" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                            <XAxis dataKey="count" type="number" hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Bar dataKey="count" radius={8} />
                        </BarChart>
                    </ChartContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-muted-foreground">Total Collected</p>
                            <p className="font-bold text-lg text-green-600">₦{paymentSummary.totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-muted-foreground">Total Outstanding</p>
                            <p className="font-bold text-lg text-red-600">₦{paymentSummary.totalOutstanding.toLocaleString()}</p>
                        </div>
                    </div>
                </>
                )}
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>A summary of all grades recorded across the school.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingGrades ? <Skeleton className="h-[250px] w-full" /> : (
                    <ChartContainer config={gradeChartConfig} className="min-h-[250px] w-full">
                    <BarChart accessibilityLayer data={gradeChartData}>
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
                        <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                    </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
