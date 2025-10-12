
'use client';
import { useState, useMemo, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { useFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import type { Student, Grade, Trait, Attendance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, BarChart2, Download, UserCircle, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ReportCardGenerator from '@/components/report-card-generator';
import Link from 'next/link';

type EnrichedStudent = Student & {
  grades: Grade[];
  traits: Trait[];
  attendance: Attendance[];
  user: {
    uid: string;
    schoolName: string;
    schoolLogo?: string;
    schoolAddress?: string;
    schoolMotto?: string;
    currentTerm: string;
    currentSession: string;
  };
};

export default function ParentPortalPage() {
  const [parentId, setParentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<EnrichedStudent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId.trim()) {
      setError('Please enter a valid Parent ID.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStudentData(null);

    try {
      const studentsQuery = query(collection(firestore, "students"), where('parentId', '==', parentId.trim()));
      const studentQuerySnapshot = await getDocs(studentsQuery);

      if (studentQuerySnapshot.empty) {
        // Fallback: search across all users' students subcollections
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        let found = false;
        for (const userDoc of usersSnapshot.docs) {
          const studentSubcollectionQuery = query(collection(userDoc.ref, "students"), where('parentId', '==', parentId.trim()));
          const studentSubcollectionSnapshot = await getDocs(studentSubcollectionQuery);
          if (!studentSubcollectionSnapshot.empty) {
            const studentDoc = studentSubcollectionSnapshot.docs[0];
            const student = { id: studentDoc.id, ...studentDoc.data() } as Student;
            
            const userRef = userDoc.ref;
            const userSnap = await getDocs(query(collection(firestore, "users"), where("uid", "==", userRef.id)));
             if (userSnap.empty) {
                throw new Error('Could not retrieve school information.');
            }
            const userData = userSnap.docs[0].data();
            const { currentTerm, currentSession } = userData;

            const subcollections = ['grades', 'traits', 'attendance'];
            const [gradesSnap, traitsSnap, attendanceSnap] = await Promise.all(
                subcollections.map(sc => getDocs(query(collection(userRef, sc), where('studentId', '==', student.id), where('term', '==', currentTerm), where('session', '==', currentSession))))
            );

            setStudentData({
                ...student,
                grades: gradesSnap.docs.map(d => ({id: d.id, ...d.data()}) as Grade),
                traits: traitsSnap.docs.map(d => ({id: d.id, ...d.data()}) as Trait),
                attendance: attendanceSnap.docs.map(d => ({id: d.id, ...d.data()}) as Attendance),
                user: {
                    uid: userSnap.docs[0].id,
                    schoolName: userData.schoolName,
                    schoolLogo: userData.schoolLogo,
                    schoolAddress: userData.schoolAddress,
                    schoolMotto: userData.schoolMotto,
                    currentTerm: currentTerm,
                    currentSession: currentSession,
                }
            });
            found = true;
            break;
          }
        }
        if (!found) {
            throw new Error('No student found with this Parent ID. Please check the ID and try again.');
        }

      } else {
        const studentDoc = studentQuerySnapshot.docs[0];
        const student = { id: studentDoc.id, ...studentDoc.data() } as Student;
        
        const userRef = doc(firestore, 'users', studentDoc.ref.parent.parent!.id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          throw new Error('Could not retrieve school information.');
        }
        const userData = userSnap.data();
        const { currentTerm, currentSession } = userData;
        
        const subcollections = ['grades', 'traits', 'attendance'];
        const [gradesSnap, traitsSnap, attendanceSnap] = await Promise.all(
          subcollections.map(sc => getDocs(query(collection(userRef, sc), where('studentId', '==', student.id), where('term', '==', currentTerm), where('session', '==', currentSession))))
        );

        setStudentData({
          ...student,
          grades: gradesSnap.docs.map(d => ({id: d.id, ...d.data()}) as Grade),
          traits: traitsSnap.docs.map(d => ({id: d.id, ...d.data()}) as Trait),
          attendance: attendanceSnap.docs.map(d => ({id: d.id, ...d.data()}) as Attendance),
          user: {
              uid: userSnap.id,
              schoolName: userData.schoolName,
              schoolLogo: userData.schoolLogo,
              schoolAddress: userData.schoolAddress,
              schoolMotto: userData.schoolMotto,
              currentTerm: currentTerm,
              currentSession: currentSession,
          }
        });
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performanceSummary = useMemo(() => {
    if (!studentData?.grades || studentData.grades.length === 0) {
      return { totalScore: 0, average: 0, highest: null, lowest: null };
    }
    const grades = studentData.grades;
    const totalScore = grades.reduce((sum, g) => sum + g.total, 0);
    const average = totalScore / grades.length;
    const sortedGrades = [...grades].sort((a, b) => b.total - a.total);
    return {
      totalScore,
      average,
      highest: sortedGrades[0],
      lowest: sortedGrades[sortedGrades.length - 1],
    };
  }, [studentData]);
  
  const getGradeColorClass = (grade: string) => {
    switch (grade) {
        case 'A': return 'bg-green-100 text-green-800';
        case 'B': return 'bg-blue-100 text-blue-800';
        case 'C': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
        <div className="flex-1">
          <Logo />
        </div>
        {studentData && (
             <Button variant="outline" onClick={() => { setStudentData(null); setParentId(''); }}>
                Search for another student
            </Button>
        )}
      </header>

      <main className="container mx-auto py-8 px-4">
        {!studentData ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Parent Portal</CardTitle>
                <CardDescription>Enter your Parent ID to view your child's academic progress.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="parentId" className="font-medium">Parent ID</label>
                    <div className="flex gap-2">
                      <Input
                        id="parentId"
                        placeholder="e.g., PARENT-XXXXXX"
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value.toUpperCase())}
                        disabled={isLoading}
                      />
                      <Button type="submit" disabled={isLoading} className="w-24">
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Search className="mr-2 h-4 w-4" /> Find</>}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="text-sm text-red-600 flex items-center gap-2">
                       <AlertTriangle className="h-4 w-4" /> {error}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-24 w-24 border">
                        <AvatarImage src={studentData.avatarUrl} alt={studentData.name} />
                        <AvatarFallback className="text-3xl">{studentData.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold font-headline">{studentData.name}</h1>
                        <p className="text-muted-foreground">{studentData.className}</p>
                        <p className="text-sm text-muted-foreground">{studentData.user.schoolName}</p>
                    </div>
                    <div>
                         <p className="text-lg font-semibold">{studentData.user.currentTerm}</p>
                         <p className="text-sm text-muted-foreground">{studentData.user.currentSession}</p>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader><CardTitle>Average Score</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{performanceSummary.average.toFixed(1)}%</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Highest Grade</CardTitle></CardHeader>
                    <CardContent>
                        {performanceSummary.highest ? (
                            <>
                                <p className="text-4xl font-bold">{performanceSummary.highest.total}</p>
                                <p className="text-muted-foreground">{performanceSummary.highest.subject}</p>
                            </>
                        ) : <p className="text-muted-foreground">N/A</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Lowest Grade</CardTitle></CardHeader>
                    <CardContent>
                         {performanceSummary.lowest ? (
                            <>
                                <p className="text-4xl font-bold">{performanceSummary.lowest.total}</p>
                                <p className="text-muted-foreground">{performanceSummary.lowest.subject}</p>
                            </>
                        ) : <p className="text-muted-foreground">N/A</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Total Subjects</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{studentData.grades.length}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Academic Performance</CardTitle><CardDescription>Overview of grades for the current term.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-center">Total Score</TableHead>
                                        <TableHead className="text-right">Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentData.grades.length > 0 ? studentData.grades.map(grade => (
                                        <TableRow key={grade.id}>
                                            <TableCell className="font-medium">{grade.subject}</TableCell>
                                            <TableCell className="text-center">{grade.total}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                 <Badge className={getGradeColorClass(grade.grade)}>{grade.grade}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No grades recorded for this term yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <div className="md:col-span-1">
                     <Card>
                         <CardHeader>
                             <CardTitle>Download Report Card</CardTitle>
                             <CardDescription>Generate and download the official end-of-term report card.</CardDescription>
                         </CardHeader>
                         <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Click the button below to generate an up-to-date, AI-enhanced report card for the current term.</p>
                            <ReportCardGenerator studentId={studentData.id} buttonLabel='Download Report Card' buttonVariant="default" />
                         </CardContent>
                     </Card>
                 </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
