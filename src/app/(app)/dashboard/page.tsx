
'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, ClipboardList } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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
    <>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="lg:col-span-2">
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
