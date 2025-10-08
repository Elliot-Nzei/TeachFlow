
'use client';
import { useState, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirebase, useUser, addDocumentNonBlocking, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, arrayUnion, increment, addDoc } from 'firebase/firestore';
import { SettingsContext } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import StudentProfileContent from '@/components/student-profile-content';

export default function StudentsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { settings, setSettings } = useContext(SettingsContext);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [studentName, setStudentName] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<any>(studentsQuery);

  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<any>(classesQuery);

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    student.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (studentName && classId && user && settings) {
        const studentClass = classes?.find(c => c.id === classId);
        if (studentClass) {
            const newStudentCount = (settings.studentCounter || 0) + 1;
            const newStudentId = `SPS-${String(newStudentCount).padStart(3, '0')}`;
            
            try {
                const studentsCollection = collection(firestore, 'users', user.uid, 'students');
                const newStudentDoc = await addDoc(studentsCollection, {
                    studentId: newStudentId,
                    name: studentName,
                    className: studentClass.name,
                    classId: classId,
                    avatarUrl: previewImage || `https://picsum.photos/seed/student-${newStudentCount}/100/100`,
                });
                
                const classRef = doc(firestore, 'users', user.uid, 'classes', classId);
                await updateDoc(classRef, {
                    students: arrayUnion(newStudentDoc.id)
                });

                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, { studentCounter: increment(1) });
                setSettings({ studentCounter: newStudentCount });

                setAddStudentOpen(false);
                setPreviewImage('');
                setStudentName('');
                setClassId('');
                
                toast({
                    title: "Student Added",
                    description: `${studentName} has been added to ${studentClass.name}.`
                });

            } catch (error) {
                console.error("Error adding student:", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not add student. Please try again."
                });
            }
        }
    }
  };

  const handleCardClick = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">All Students</h1>
        <div className="flex items-center gap-4">
            <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search students..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new student. A unique ID will be generated automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddStudent}>
                        <div className="grid gap-6 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={previewImage} alt="Student preview" />
                                    <AvatarFallback className="text-3xl">
                                        {previewImage ? '' : <UserPlus />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="picture">Student Picture</Label>
                                    <Input id="picture" type="file" accept="image/*" onChange={handleImageUpload} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student-name">Full Name</Label>
                                <Input id="student-name" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g., John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student-class">Class</Label>
                                <Select onValueChange={setClassId} value={classId} required>
                                    <SelectTrigger id="student-class">
                                    <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {isLoadingClasses ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                                    classes?.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Student</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>
      <Sheet open={!!selectedStudentId} onOpenChange={(isOpen) => !isOpen && setSelectedStudentId(null)}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoadingStudents ? Array.from({length: 8}).map((_, i) => (
              <Card key={i}><CardContent className="h-40 bg-muted rounded-lg animate-pulse" /></Card>
          )) : filteredStudents?.map((student) => (
            <SheetTrigger asChild key={student.id}>
              <div onClick={() => handleCardClick(student.id)} className="group cursor-pointer">
                <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:-translate-y-1">
                  <CardContent className="p-0 text-center">
                    <div className="bg-muted/50 p-6">
                        <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-background shadow-md">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback className="text-2xl">{student.name.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-lg font-bold font-headline">{student.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{student.studentId}</CardDescription>
                    </div>
                    <div className="p-4">
                        <Badge variant="secondary">{student.className}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SheetTrigger>
          ))}
        </div>
         {filteredStudents?.length === 0 && !isLoadingStudents && (
          <div className="text-center col-span-full py-12">
              <p className="text-muted-foreground">No students found matching your search.</p>
          </div>
        )}
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
            {selectedStudentId && <StudentProfileContent studentId={selectedStudentId} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
