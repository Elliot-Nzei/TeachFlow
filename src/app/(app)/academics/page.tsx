
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { placeholderClasses, placeholderSubjects } from '@/lib/placeholder-data';
import type { Subject, Class } from '@/lib/types';
import { BookCopy, PlusCircle, Trash2, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';


export default function AcademicsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(placeholderSubjects);
  const [classes, setClasses] = useState<Class[]>(placeholderClasses);
  const [newSubject, setNewSubject] = useState('');
  const [open, setOpen] = useState(false)

  const handleAddSubject = () => {
    if (newSubject.trim() !== '') {
      const newSubjectObj: Subject = {
        id: `subj-${subjects.length + 1}`,
        name: newSubject.trim(),
      };
      setSubjects([...subjects, newSubjectObj]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    setSubjects(subjects.filter(s => s.id !== subjectId));
    // Also remove this subject from any class that has it
    setClasses(classes.map(c => ({
        ...c,
        subjects: c.subjects.filter(sName => subjects.find(sub => sub.id === subjectId)?.name !== sName)
    })));
  };

  const handleToggleSubjectForClass = (classId: string, subjectName: string) => {
    setClasses(classes.map(c => {
        if (c.id === classId) {
            const hasSubject = c.subjects.includes(subjectName);
            if (hasSubject) {
                return { ...c, subjects: c.subjects.filter(s => s !== subjectName) };
            } else {
                return { ...c, subjects: [...c.subjects, subjectName] };
            }
        }
        return c;
    }));
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-8">Academics</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Master Subject List</CardTitle>
              <CardDescription>Manage all subjects offered in the school.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New subject name..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <Button onClick={handleAddSubject} size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveSubject(subject.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Class Subject Management</CardTitle>
                    <CardDescription>Assign subjects from the master list to each class.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {classes.map(cls => (
                        <div key={cls.id} className="border p-4 rounded-lg">
                            <h3 className="font-bold text-lg font-headline mb-3">{cls.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {cls.subjects.length > 0 ? cls.subjects.map(subjectName => (
                                    <Badge key={subjectName} variant="default" className="flex items-center gap-1.5">
                                        {subjectName}
                                        <button onClick={() => handleToggleSubjectForClass(cls.id, subjectName)}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
                                )}
                            </div>
                            
                            <Popover open={open && open[cls.id]} onOpenChange={(isOpen) => setOpen(prev => ({...prev, [cls.id]: isOpen}))}>
                                <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add/Remove Subjects
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Filter subjects..." />
                                    <CommandList>
                                        <CommandEmpty>No subject found.</CommandEmpty>
                                        <CommandGroup>
                                            {subjects.map(subject => {
                                                const isSelected = cls.subjects.includes(subject.name);
                                                return (
                                                    <CommandItem
                                                        key={subject.id}
                                                        value={subject.name}
                                                        onSelect={() => handleToggleSubjectForClass(cls.id, subject.name)}
                                                    >
                                                        <div className={cn(
                                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                        )}>
                                                          <Check className={cn("h-4 w-4")} />
                                                        </div>
                                                        <span>{subject.name}</span>
                                                    </CommandItem>
                                                )
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
