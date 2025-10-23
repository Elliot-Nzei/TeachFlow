
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookCopy, PlusCircle, Trash2, X, Check, Book, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, toTitleCase } from '@/lib/utils';
import { useCollection, useFirebase, useUser, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function AcademicsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [newSubject, setNewSubject] = useState('');
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const subjectsQuery = useMemoFirebase(() => user && query(collection(firestore, 'users', user.uid, 'subjects')), [firestore, user]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<any>(subjectsQuery);

  const classesQuery = useMemoFirebase(() => user && query(collection(firestore, 'users', user.uid, 'classes')), [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<any>(classesQuery);

  const subjectNames = useMemo(() => subjects?.map(s => s.name.toLowerCase()) || [], [subjects]);

  const handleAddSubject = async () => {
    if (newSubject.trim() !== '' && user) {
      if (subjectNames.includes(newSubject.trim().toLowerCase())) {
        toast({
          variant: 'destructive',
          title: 'Duplicate Subject',
          description: 'This subject already exists in your master list.',
        });
        return;
      }
      const subjectsCollection = collection(firestore, 'users', user.uid, 'subjects');
      addDocumentNonBlocking(subjectsCollection, { name: newSubject.trim() });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    if (user) {
      const subjectDoc = doc(firestore, 'users', user.uid, 'subjects', subjectId);
      deleteDocumentNonBlocking(subjectDoc);
      toast({
        title: 'Subject Removed',
        description: 'The subject has been removed from the master list.',
      });
    }
  };

  const handleToggleSubjectForClass = (classId: string, subjectName: string) => {
    if(user) {
        const classRef = doc(firestore, 'users', user.uid, 'classes', classId);
        const selectedClass = classes?.find(c => c.id === classId);
        if (selectedClass) {
            const hasSubject = selectedClass.subjects?.includes(subjectName);
            const updatedSubjects = hasSubject
                ? selectedClass.subjects.filter((s: string) => s !== subjectName)
                : [...(selectedClass.subjects || []), subjectName];
            
            updateDocumentNonBlocking(classRef, { subjects: updatedSubjects });
        }
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-8">Academics</h1>
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Subject Management</CardTitle>
                    <CardDescription>Manage your school's subjects and assign them to classes.</CardDescription>
                </div>
                <div className="flex gap-2 w-full md:w-auto md:min-w-[250px]">
                    <Input
                    placeholder="Add new subject..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(toTitleCase(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                    />
                    <Button onClick={handleAddSubject} size="icon" aria-label="Add Subject">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="manage" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manage"><Book className="mr-2 h-4 w-4" />Manage Subjects</TabsTrigger>
                    <TabsTrigger value="assign"><Edit className="mr-2 h-4 w-4" />Assign to Classes</TabsTrigger>
                </TabsList>
                <TabsContent value="manage" className="pt-6">
                   <div className="space-y-2 max-w-lg mx-auto">
                        {(isLoadingSubjects || !subjects) ? Array.from({length: 3}).map((_,i) => <div key={i} className="h-10 bg-muted rounded-md animate-pulse" />) :
                        subjects.map(subject => (
                        <div key={subject.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                            <span className="text-sm font-medium">{subject.name}</span>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the subject "<strong>{subject.name}</strong>" from your master list. It will not remove it from classes that already have it assigned.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveSubject(subject.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="assign" className="pt-6">
                    <div className="space-y-6">
                        {(isLoadingClasses || !classes) ? Array.from({length: 2}).map((_,i) => <div key={i} className="h-40 bg-muted rounded-md animate-pulse" />) :
                        classes.map(cls => (
                            <div key={cls.id} className="border p-4 rounded-lg">
                                <h3 className="font-bold text-lg font-headline mb-3">{cls.name}</h3>
                                <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
                                    {cls.subjects?.length > 0 ? cls.subjects.map((subjectName: string) => (
                                        <Badge key={subjectName} variant="default" className="flex items-center gap-1">
                                            {subjectName}
                                            <button onClick={() => handleToggleSubjectForClass(cls.id, subjectName)} className="rounded-full hover:bg-primary-foreground/20 p-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )) : (
                                        <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
                                    )}
                                </div>
                                
                                <Popover open={!!openPopovers[cls.id]} onOpenChange={(isOpen) => setOpenPopovers(prev => ({...prev, [cls.id]: isOpen}))}>
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
                                                {subjects?.map(subject => {
                                                    const isSelected = cls.subjects?.includes(subject.name);
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
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
