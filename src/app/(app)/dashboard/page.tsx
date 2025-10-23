
'use client';
import { useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, UserPlus, Home, DollarSign } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';
import { SettingsContext } from '@/contexts/settings-context';
import type { Payment, Student } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { settings, isLoading: isLoadingSettings } = useContext(SettingsContext);
  const isMobile = useIsMobile();

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

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
    if (!payments || !students || !classes) return { paid: 0, partially: 0, owing: 0, totalCollected: 0, totalOutstanding: 0 };

    let paid = 0;
    let partially = 0;
    let owing = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

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

  const isLoading = isLoadingStudents || isLoadingClasses || isLoadingSubjects || isLoadingPayments || isLoadingGrades;

  return (
    <div className="space-y-6">
       <Card>
          <CardHeader>
              <CardTitle>School Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                      <Users className="h-6 w-6 text-primary"/>
                      <p className="text-2xl font-bold">{students?.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                   <div className="flex flex-col items-center gap-1">
                      <Home className="h-6 w-6 text-primary"/>
                      <p className="text-2xl font-bold">{classes?.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                      <BookOpen className="h-6 w-6 text-primary"/>
                      <p className="text-2xl font-bold">{subjects?.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                      <DollarSign className="h-6 w-6 text-primary"/>
                      <p className="text-2xl font-bold">₦{paymentSummary.totalCollected.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Collected</p>
                  </div>
              </div>
            )}
          </CardContent>
       </Card>

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
                      <p className="font-semibold text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.className || 'Unassigned'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{student.createdAt ? formatDistanceToNow(student.createdAt.toDate(), {addSuffix: true}) : ''}</p>
                  </div>
                ))}
              </div>
            </div>
             <Separator />
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
                                <p className="font-semibold text-sm">{cls.name}</p>
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
            <Tabs defaultValue="payments">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payments">Payment Summary</TabsTrigger>
                <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
              </TabsList>
              <TabsContent value="payments" className="mt-4">
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" />Fee Payments</CardTitle>
                      <CardDescription>{settings?.currentTerm}, {settings?.currentSession}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {isLoadingPayments || isLoadingStudents ? <Skeleton className="h-[250px] w-full" /> : (
                      <>
                          <ChartContainer config={paymentChartConfig} className="min-h-[250px] w-full">
                              <BarChart accessibilityLayer data={paymentChartData} layout={isMobile ? "vertical" : "horizontal"} margin={isMobile ? { right: 20 } : { top: 20 }}>
                                  <CartesianGrid horizontal={isMobile} vertical={!isMobile} />
                                  {isMobile ? (
                                      <>
                                          <YAxis dataKey="status" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                                          <XAxis dataKey="count" type="number" hide />
                                      </>
                                  ) : (
                                      <>
                                          <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
                                          <YAxis />
                                      </>
                                  )}
                                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                  <Bar dataKey="count" radius={8} />
                              </BarChart>
                          </ChartContainer>
                          <div className="mt-4 text-center">
                              <p className="text-sm text-muted-foreground">Total Outstanding</p>
                              <p className="font-bold text-2xl text-red-600">₦{paymentSummary.totalOutstanding.toLocaleString()}</p>
                          </div>
                      </>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="grades" className="mt-4">
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
                              <YAxis />
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
              </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
