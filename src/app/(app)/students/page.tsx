
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
import { useCollection, useFirebase, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, arrayUnion, increment, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SettingsContext } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import StudentProfileContent from '@/components/student-profile-content';
import Image from 'next/image';

export default function StudentsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { settings, setSettings } = useContext(SettingsContext);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    if (studentName && user && settings) {
        const studentClass = classes?.find(c => c.id === classId);
        
        const schoolAcronym = settings.schoolName
          ? settings.schoolName
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
          : 'SPS';

        const newStudentCount = (settings.studentCounter || 0) + 1;
        const newStudentId = `${schoolAcronym}-${String(newStudentCount).padStart(3, '0')}`;
        
        try {
            const studentsCollection = collection(firestore, 'users', user.uid, 'students');
            const newStudentDoc = await addDoc(studentsCollection, {
                studentId: newStudentId,
                name: studentName,
                // Assign empty strings if no class is selected
                className: studentClass?.name || '',
                classId: studentClass?.id || '',
                avatarUrl: previewImage || `https://picsum.photos/seed/student-${newStudentCount}/200/200`,
                createdAt: serverTimestamp(),
            });
            
            // If a class was selected, update the class document as well
            if (studentClass) {
              const classRef = doc(firestore, 'users', user.uid, 'classes', classId);
              await updateDoc(classRef, {
                  students: arrayUnion(newStudentDoc.id)
              });
            }

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { studentCounter: increment(1) });
            setSettings({ studentCounter: newStudentCount });

            setAddStudentOpen(false);
            setPreviewImage('');
            setStudentName('');
            setClassId('');
            
            toast({
                title: "Student Added",
                description: `${studentName} has been added.`
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
  };

  const handleCardClick = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold font-headline">All Students</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:max-w-xs">
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
                    <Button className="w-full sm:w-auto">
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
                                    {previewImage ? (
                                        <AvatarImage src={previewImage} alt="Student preview" />
                                    ) : (
                                        <AvatarFallback className="text-3xl">
                                            <UserPlus />
                                        </AvatarFallback>
                                    )}
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
                                <Label htmlFor="student-class">Class (Optional)</Label>
                                <Select onValueChange={setClassId} value={classId}>
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
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {isLoadingStudents ? Array.from({length: 12}).map((_, i) => (
              <Card key={i} className="w-40 h-40"><CardContent className="h-full bg-muted rounded-lg animate-pulse" /></Card>
          )) : filteredStudents?.map((student, index) => (
            <SheetTrigger asChild key={student.id}>
              <div onClick={() => handleCardClick(student.id)} className="group cursor-pointer">
                <Card className="w-40 h-40 overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <CardContent className="p-0 text-center flex flex-col h-full relative">
                    {student.avatarUrl && (
                      <Image 
                        src={student.avatarUrl} 
                        alt={student.name} 
                        fill
                        sizes="160px"
                        priority={index < 12}
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="relative flex flex-col h-full justify-end p-3 text-white">
                        <p className="text-sm font-bold font-headline leading-tight">{student.name}</p>
                        <p className="font-mono text-xs text-white/80">{student.studentId}</p>
                        {student.className && <Badge variant="secondary" className="text-xs mt-1 self-center">{student.className}</Badge>}
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
          <SheetHeader>
            <SheetTitle>Student Profile</SheetTitle>
            <SheetDescription>
              View the academic record and details for this student.
            </SheetDescription>
          </SheetHeader>
          {selectedStudentId && <StudentProfileContent studentId={selectedStudentId} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

    