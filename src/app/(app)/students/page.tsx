'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderStudents } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = placeholderStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">All Students</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students by name, ID, or class..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
