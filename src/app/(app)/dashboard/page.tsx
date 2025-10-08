import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { placeholderClasses, placeholderGrades, placeholderTransfers } from '@/lib/placeholder-data';
import { Users, BookOpen, ClipboardList, ArrowRightLeft, Badge } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const totalStudents = placeholderClasses.reduce((sum, current) => sum + current.students.length, 0);
  const totalSubjects = placeholderClasses.reduce((sum, current) => sum + current.subjects.length, 0);
  const totalClasses = placeholderClasses.length;
  
  const gradeCounts = Object.values(placeholderGrades).flat().reduce((acc, grade) => {
    acc[grade.grade] = (acc[grade.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { title: 'Total Students', value: totalStudents, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Subjects', value: totalSubjects, icon: <BookOpen className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Total Classes', value: totalClasses, icon: <ClipboardList className="h-4 w-4 text-muted-foreground" /> },
    { title: 'Data Transfers', value: placeholderTransfers.length, icon: <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
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
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Data Transfers</CardTitle>
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
                {placeholderTransfers.map((transfer) => (
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
        <Card>
          <CardHeader>
            <CardTitle>Grades Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around pt-6">
            {['A', 'B', 'C', 'D', 'F'].map((grade) => (
              <div key={grade} className="text-center">
                <p className="text-4xl font-bold">{gradeCounts[grade] || 0}</p>
                <p className="text-lg text-muted-foreground font-semibold">{grade}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
