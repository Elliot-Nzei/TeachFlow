'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderStudents, placeholderClasses } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, UserPlus, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [students, setStudents] = useState(placeholderStudents);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPreviewImage(URL.createObjectURL(file));
    }
  };
  
  const handleAddStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const studentName = (form.elements.namedItem('student-name') as HTMLInputElement).value;
    const classId = (form.elements.namedItem('student-class') as HTMLInputElement).value;
    
    if (studentName && classId) {
        const studentClass = placeholderClasses.find(c => c.id === classId);
        if (studentClass) {
            const newIdNumber = students.length + 1;
            const newStudent = {
                id: `student-${newIdNumber}`,
                studentId: `SPS-${String(newIdNumber).padStart(3, '0')}`,
                name: studentName,
                class: studentClass.name,
                classId: classId,
                avatarUrl: previewImage || `https://picsum.photos/seed/student-${newIdNumber}/100/100`,
            };
            setStudents([...students, newStudent]);
            setAddStudentOpen(false);
            setPreviewImage('');
        }
    }
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
                                <Input id="student-name" name="student-name" placeholder="e.g., John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student-class">Class</Label>
                                <Select name="student-class" required>
                                    <SelectTrigger id="student-class">
                                    <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {placeholderClasses.map(cls => (
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStudents.map((student) => (
          <Link href={`/students/${student.id}`} key={student.id} className="group">
            <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:-translate-y-1">
              <CardContent className="p-0 text-center">
                <div className="bg-muted/50 p-6">
                    <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-background shadow-md">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback className="text-2xl">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-bold font-headline">{student.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{student.studentId}</CardDescription>
                </div>
                <div className="p-4">
                    <Badge variant="secondary">{student.class}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
       {filteredStudents.length === 0 && (
        <div className="text-center col-span-full py-12">
            <p className="text-muted-foreground">No students found matching your search.</p>
        </div>
      )}
    </>
  );
}
