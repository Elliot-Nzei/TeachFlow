
'use client';
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, CheckCircle, XCircle, Clock, Star, Home, UserCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ParentStudentProfile({ student }: { student: any }) {
  const [activeTab, setActiveTab] = useState('academic-record');
  const isMobile = useIsMobile();

  const attendanceSummary = useMemo(() => {
    if (!student?.attendance) {
      return { present: 0, absent: 0, late: 0 };
    }
    return {
      present: student.attendance.filter((a: any) => a.status === 'Present').length,
      absent: student.attendance.filter((a: any) => a.status === 'Absent').length,
      late: student.attendance.filter((a: any) => a.status === 'Late').length,
    };
  }, [student?.attendance]);

  if (!student) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  const AttendanceIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'Present': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'Absent': return <XCircle className="h-5 w-5 text-red-500" />;
        case 'Late': return <Clock className="h-5 w-5 text-yellow-500" />;
        default: return null;
    }
  };

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback className="text-3xl">{student.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold font-headline">{student.name}</h2>
                    <p className="font-mono text-sm text-muted-foreground">{student.studentId}</p>
                    {student.className && <Badge variant="outline" className="mt-1">{student.className}</Badge>}
                </div>
            </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    {student.address ? (
                        <div className="text-sm">
                            <p className="text-muted-foreground">Address</p>
                            <p className="font-medium">{student.address}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No residential address provided.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCircle2 className="h-5 w-5" /> Guardian Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {(student.guardianName || student.guardianPhone || student.guardianEmail) ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {student.guardianName && <div><p className="text-muted-foreground">Name</p><p className="font-medium">{student.guardianName}</p></div>}
                            {student.guardianPhone && <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{student.guardianPhone}</p></div>}
                            {student.guardianEmail && <div className="col-span-2"><p className="text-muted-foreground">Email</p><p className="font-medium">{student.guardianEmail}</p></div>}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No guardian information provided.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 md:p-6 pt-0">
         {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic-record">Academic Record</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="academic-record">Academic Record</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="academic-record" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Academic Record</CardTitle>
                    <CardDescription>Grades for all sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>Total Score</TableHead>
                            <TableHead className="text-right">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {student.grades && student.grades.length > 0 ? (
                                student.grades.map((grade: any) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">{grade.subject}</TableCell>
                                        <TableCell>{grade.term}</TableCell>
                                        <TableCell>{grade.session}</TableCell>
                                        <TableCell>{grade.total}</TableCell>
                                        <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                    No grades recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="attendance" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5"/>
                        Attendance History
                    </CardTitle>
                    <CardDescription>Full attendance record for the student.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-3 gap-2 text-center mb-6 border-b pb-4">
                        <div>
                            <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
                            <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
                            <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.late}</p>
                            <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                    </div>
                    {student.attendance && student.attendance.length > 0 ? (
                         student.attendance.sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date)).map((att: any) => (
                            <div key={att.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <AttendanceIcon status={att.status} />
                                    <span className="text-sm font-medium">{format(new Date(att.date), 'PPP')}</span>
                                </div>
                                <Badge variant={
                                    att.status === 'Present' ? 'default' : att.status === 'Absent' ? 'destructive' : 'secondary'
                                } className={att.status === 'Present' ? 'bg-green-600' : ''}>{att.status}</Badge>
                            </div>
                         ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No attendance records found.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default ParentStudentProfile;
