
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, PlusCircle, Users, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { useCollection, useFirebase, useUser, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp } from 'firebase/firestore';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ClassDetailsContent from '@/components/class-details-content';
import type { Class } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const ClassCard = ({ cls, onClick }: { cls: Class, onClick: () => void }) => (
    <SheetTrigger asChild key={cls.id}>
        <div onClick={onClick} className="h-full">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline">{cls.name}</CardTitle>
                <CardDescription>Level {cls.level}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls.students?.length || 0} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{cls.subjects?.length || 0} Subjects</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full">View Details</Button>
            </CardFooter>
            </Card>
        </div>
    </SheetTrigger>
);

const ClassListItem = ({ cls, onClick }: { cls: Class, onClick: () => void }) => (
    <SheetTrigger asChild key={cls.id}>
        <div onClick={onClick} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-muted border">
            <div className="flex-1">
                <p className="font-semibold font-headline">{cls.name}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1.5">
                         <Badge variant="outline">Level {cls.level}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{cls.students?.length || 0} Students</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{cls.subjects?.length || 0} Subjects</span>
                    </div>
                </div>
            </div>
            <Button variant="ghost" size="sm">View <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
    </SheetTrigger>
);


export default function ClassesPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
    const { data: classes, isLoading } = useCollection<Class>(classesQuery);

    const classLevels = Array.from({length: 12}, (_, i) => i + 1);

    const handleAddClass = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newClassName.trim() && selectedLevel !== null && user) {
            const classesCollection = collection(firestore, 'users', user.uid, 'classes');
            addDocumentNonBlocking(classesCollection, {
                name: newClassName,
                level: selectedLevel,
                students: [],
                subjects: [],
                createdAt: serverTimestamp(),
            });
            setNewClassName('');
            setSelectedLevel(null);
            setIsDialogOpen(false);
        }
    };

    const handleCardClick = (classId: string) => {
      setSelectedClassId(classId);
    };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Classes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Enter the name for the new class and assign its academic level.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClass}>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g., Primary 5A" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="level" className="text-right">Level</Label>
                    <div className="col-span-3">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {selectedLevel !== null ? `Level ${selectedLevel}` : "Select level..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width)] p-0">
                                <Command>
                                <CommandInput placeholder="Search level..." />
                                <CommandList>
                                    <CommandEmpty>No level found.</CommandEmpty>
                                    <CommandGroup>
                                    {classLevels.map((level) => (
                                        <CommandItem
                                        key={level}
                                        value={String(level)}
                                        onSelect={() => {
                                            setSelectedLevel(level);
                                        }}
                                        >
                                         <Check className={cn("mr-2 h-4 w-4", selectedLevel === level ? "opacity-100" : "opacity-0")} />
                                        Level {level}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                </div>
                <DialogFooter>
                <Button type="submit">Save Class</Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Sheet open={!!selectedClassId} onOpenChange={(isOpen) => !isOpen && setSelectedClassId(null)}>
        {/* Desktop Grid View */}
        <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
          {isLoading ? Array.from({length: 4}).map((_, i) => (
              <Card key={i}><CardContent className="h-48 bg-muted rounded-lg animate-pulse" /></Card>
          )) : (classes || []).sort((a,b) => a.level - b.level).map((cls) => (
            <ClassCard key={cls.id} cls={cls} onClick={() => handleCardClick(cls.id)} />
          ))}
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-3 mt-8">
           {isLoading ? Array.from({length: 3}).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
          )) : (classes || []).sort((a,b) => a.level - b.level).map((cls) => (
             <ClassListItem 
                key={cls.id}
                cls={cls}
                onClick={() => handleCardClick(cls.id)}
            />
          ))}
        </div>

        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Class Details</SheetTitle>
            <SheetDescription>
              View the students and subjects for this class.
            </SheetDescription>
          </SheetHeader>
          {selectedClassId && <ClassDetailsContent classId={selectedClassId} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
