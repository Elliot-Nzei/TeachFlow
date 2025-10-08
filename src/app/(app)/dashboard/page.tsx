import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { placeholderClasses, placeholderGrades, placeholderTransfers } from '@/lib/placeholder-data';
import { Users, BookOpen, ClipboardList, ArrowRightLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

export default function DashboardPage() {
  const totalStudents = placeholderClasses.reduce((sum, current) => sum + current.students.length, 0);
  const totalSubjects = placeholderClasses.reduce((sum, current) => sum + current.subjects.length, 0);
  const totalClasses = placeholderClasses.length;
  
  const gradeCounts = Object.values(placeholderGrades).flat().reduce((acc, grade) => {
    acc[grade.grade] = (acc[grade.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = [
    { grade: "A", count: gradeCounts['A'] || 0 },
    { grade: "B", count: gradeCounts['B'] || 0 },
    { grade: "C", count: gradeCounts['C'] || 0 },
    { grade: "D", count: gradeCounts['D'] || 0 },
    { grade: "F", count: gradeCounts['F'] || 0 },
  ]

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  const stats = [
    { title: 'Total Students', value: totalStudents, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Classes', value: totalClasses, icon: <ClipboardList className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Subjects', value: totalSubjects, icon: <BookOpen className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Data Transfers', value: placeholderTransfers.length, icon: <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> },
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
              <div className="text-2xl font-bold">{stat.value}</div>
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
                  {placeholderTransfers.slice(0, 5).map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div className="font-medium">{transfer.dataType}</div>
                        <div className="text-sm text-muted-foreground">
                          {transfer.fromUser.startsWith('You') ? `To: ${transfer.toUser}` : `From: ${transfer.fromUser}`}
                        </div>
                      </TableCell>
                      <TableCell>{transfer.dataTransferred}</TableCell>
                      <TableCell className="text-right">{formatDistanceToNow(new Date(transfer.timestamp), { addSuffix: true })}</TableCell>
                    </TableRow>
                  ))}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
