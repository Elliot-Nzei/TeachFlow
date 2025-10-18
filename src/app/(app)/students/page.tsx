
'use client';
import { useState, useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, ChevronRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, doc, arrayUnion, increment, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SettingsContext } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import StudentProfileContent from '@/components/student-profile-content';
import Image from 'next/image';
import type { Student } from '@/lib/types';
import placeholderImages from '@/lib/placeholder-images.json';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toTitleCase } from '@/lib/utils';
import { usePlan } from '@/contexts/plan-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const StudentCard = ({ student, index, onClick }: { student: Student, index: number, onClick: () => void }) => (
    <div onClick={onClick} className="group cursor-pointer hidden md:block">
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
);

const StudentListItem = ({ student, onClick }: { student: Student, onClick: () => void }) => (
    <div onClick={onClick} className="flex items-center gap-4 p-2 -mx-2 rounded-lg cursor-pointer hover:bg-muted md:hidden">
        <Avatar className="h-12 w-12">
            <AvatarImage src={student.avatarUrl} alt={student.name} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="font-semibold">{student.name}</p>
            <p className="text-sm text-muted-foreground">{student.studentId} {student.className && `• ${student.className}`}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
);


export default function StudentsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { settings, setSettings } = useContext(SettingsContext);
  const { toast } = useToast();
  const { features } = usePlan();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  
  const [newStudent, setNewStudent] = useState({
      name: '',
      classId: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: ''
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<any>(classesQuery);

  const atStudentLimit = useMemo(() => {
    if (features.studentLimit === 'Unlimited' || !students) return false;
    return students.length >= features.studentLimit;
  }, [students, features.studentLimit]);

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
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
  
  const resetForm = () => {
      setNewStudent({ name: '', classId: '', address: '', guardianName: '', guardianPhone: '', guardianEmail: '' });
      setPreviewImage('');
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      const formattedValue = (id === 'name' || id === 'guardianName') ? toTitleCase(value) : value;
      setNewStudent(prev => ({...prev, [id]: formattedValue }));
  }

  const handleClassSelect = (value: string) => {
      setNewStudent(prev => ({...prev, classId: value}));
  }

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (atStudentLimit) {
        toast({
            variant: 'destructive',
            title: 'Student Limit Reached',
            description: 'Please upgrade your plan to add more students.',
        });
        return;
    }

    if (newStudent.name && user && settings) {
        const studentClass = classes?.find(c => c.id === newStudent.classId);
        
        const userCodePrefix = settings.userCode
          ? settings.userCode.split('-')[0]
          : 'SPS';

        const newStudentCount = (settings.studentCounter || 0) + 1;
        const newStudentId = `${userCodePrefix}-${String(newStudentCount).padStart(3, '0')}`;
        
        try {
            const studentsCollection = collection(firestore, 'users', user.uid, 'students');
            const studentData = {
                studentId: newStudentId,
                name: newStudent.name,
                address: newStudent.address || '',
                className: studentClass?.name || '',
                classId: studentClass?.id || '',
                avatarUrl: previewImage || placeholderImages.placeholderImages.find(img => img.id === 'hero-students')?.imageUrl || `https://picsum.photos/seed/student-${newStudentCount}/200/200`,
                guardianName: newStudent.guardianName || '',
                guardianPhone: newStudent.guardianPhone || '',
                guardianEmail: newStudent.guardianEmail || '',
                createdAt: serverTimestamp(),
            };

            const newStudentDoc = await addDoc(studentsCollection, studentData);
            
            if (studentClass) {
              const classRef = doc(firestore, 'users', user.uid, 'classes', newStudent.classId);
              await updateDoc(classRef, {
                  students: arrayUnion(newStudentDoc.id)
              });
            }

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { studentCounter: increment(1) });
            setSettings({ studentCounter: newStudentCount });

            setAddStudentOpen(false);
            resetForm();
            
            toast({
                title: "Student Added",
                description: `${newStudent.name} has been added.`
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
                <Tooltip>
                    <TooltipTrigger asChild>
                         <div tabIndex={atStudentLimit ? 0 : undefined}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto" disabled={atStudentLimit}>
                                    {atStudentLimit && <Lock className="mr-2 h-4 w-4" />}
                                    <UserPlus className="mr-2 h-4 w-4" /> Add Student
                                </Button>
                            </DialogTrigger>
                        </div>
                    </TooltipTrigger>
                    {atStudentLimit && (
                        <TooltipContent>
                            <p>You have reached the student limit for your current plan.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new student. A unique ID will be generated automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddStudent}>
                      <ScrollArea className="h-[60vh] -mx-6 px-6">
                        <div className="grid gap-4 py-4">
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
                            
                            <h3 className="font-semibold border-b pb-2">Student Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input id="name" value={newStudent.name} onChange={handleInputChange} placeholder="e.g., John Doe" required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="address">Residential Address</Label>
                                    <Input id="address" value={newStudent.address} onChange={handleInputChange} placeholder="e.g., 123 Main Street, Lagos" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="classId">Class (Optional)</Label>
                                    <Select onValueChange={handleClassSelect} value={newStudent.classId}>
                                        <SelectTrigger id="classId">
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
                            
                            <h3 className="font-semibold border-b pb-2 mt-4">Parent/Guardian Information</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="guardianName">Guardian's Full Name</Label>
                                    <Input id="guardianName" value={newStudent.guardianName} onChange={handleInputChange} placeholder="e.g., Jane Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guardianPhone">Guardian's Phone</Label>
                                    <Input id="guardianPhone" type="tel" value={newStudent.guardianPhone} onChange={handleInputChange} placeholder="e.g., 08012345678" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="guardianEmail">Guardian's Email</Label>
                                    <Input id="guardianEmail" type="email" value={newStudent.guardianEmail} onChange={handleInputChange} placeholder="e.g., guardian@example.com" />
                                </div>
                            </div>
                        </div>
                      </ScrollArea>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Student</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>
      <Sheet open={!!selectedStudentId} onOpenChange={(isOpen) => !isOpen && setSelectedStudentId(null)}>
        
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:space-y-0 space-y-2">
          {isLoadingStudents ? Array.from({length: 12}).map((_, i) => (
              <div key={i}>
                <Card className="w-40 h-40 hidden md:block"><CardContent className="h-full bg-muted rounded-lg animate-pulse" /></Card>
                <div className="flex items-center gap-4 p-2 md:hidden">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                    </div>
                </div>
              </div>
          )) : filteredStudents?.map((student, index) => (
             <SheetTrigger asChild key={student.id}>
                <div>
                    <StudentCard 
                        student={student} 
                        index={index}
                        onClick={() => handleCardClick(student.id)} 
                    />
                    <StudentListItem 
                        student={student}
                        onClick={() => handleCardClick(student.id)}
                    />
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

    