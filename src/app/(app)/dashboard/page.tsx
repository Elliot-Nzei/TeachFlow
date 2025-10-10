
'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, ClipboardList, UserPlus, Home } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

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
  
  const gradeCounts = useMemo(() => (grades || []).reduce((acc: Record<string, number>, grade: any) => {
    if (grade.grade) {
      acc[grade.grade] = (acc[grade.grade] || 0) + 1;
    }
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
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>A summary of all grades recorded across the school.</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoadingGrades ? <Skeleton className="h-[300px] w-full" /> : (
                  <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
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
                      <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                  </BarChart>
                  </ChartContainer>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
