
'use client';
import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';


const ClassListItem = ({ cls, onClick }: { cls: Class, onClick: () => void }) => (
    <SheetTrigger asChild key={cls.id}>
        <div onClick={onClick}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow group">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <p className="font-bold font-headline text-lg group-hover:text-primary transition-colors">{cls.name}</p>
                            <Badge variant="secondary">{cls.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{cls.students?.length || 0} Students</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" />
                                <span>{cls.subjects?.length || 0} Subjects</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    </SheetTrigger>
);

type ClassCategory = 'Early Years' | 'Primary' | 'Junior Secondary' | 'Senior Secondary';

const classCategories: ClassCategory[] = ['Early Years', 'Primary', 'Junior Secondary', 'Senior Secondary'];


export default function ClassesPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ClassCategory | ''>('');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
    const { data: classes, isLoading } = useCollection<Class>(classesQuery);

    const classGrades = Array.from({length: 12}, (_, i) => i + 1);

    const handleAddClass = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newClassName.trim() && selectedGrade !== null && selectedCategory && user) {
            const classesCollection = collection(firestore, 'users', user.uid, 'classes');
            addDocumentNonBlocking(classesCollection, {
                name: newClassName,
                grade: selectedGrade,
                category: selectedCategory,
                students: [],
                subjects: [],
                createdAt: serverTimestamp(),
            });
            setNewClassName('');
            setSelectedGrade(null);
            setSelectedCategory('');
            setIsDialogOpen(false);
        }
    };

    const handleCardClick = (classId: string) => {
      setSelectedClassId(classId);
    };
    
    const filteredClasses = (category: string) => {
        const sorted = (classes || []).sort((a,b) => a.grade - b.grade);
        if (category === 'All') return sorted;
        return sorted.filter(c => c.category === category);
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
                Enter the name for the new class and assign its academic details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClass}>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g., Primary 5A" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <div className="col-span-3">
                         <Select onValueChange={(value: ClassCategory) => setSelectedCategory(value)} value={selectedCategory}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {classCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="grade" className="text-right">Grade</Label>
                    <div className="col-span-3">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {selectedGrade !== null ? `Grade ${selectedGrade}` : "Select grade..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width)] p-0">
                                <Command>
                                <CommandInput placeholder="Search grade..." />
                                <CommandList>
                                    <CommandEmpty>No grade found.</CommandEmpty>
                                    <CommandGroup>
                                    {classGrades.map((grade) => (
                                        <CommandItem
                                        key={grade}
                                        value={String(grade)}
                                        onSelect={() => {
                                            setSelectedGrade(grade);
                                        }}
                                        >
                                         <Check className={cn("mr-2 h-4 w-4", selectedGrade === grade ? "opacity-100" : "opacity-0")} />
                                        Grade {grade}
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

       <Tabs defaultValue="All" className="mt-6">
        <TabsList>
            <TabsTrigger value="All">All Classes</TabsTrigger>
            {classCategories.map(cat => (
                <TabsTrigger key={cat} value={cat} disabled={filteredClasses(cat).length === 0}>
                    {cat}
                </TabsTrigger>
            ))}
        </TabsList>

        <Sheet open={!!selectedClassId} onOpenChange={(isOpen) => !isOpen && setSelectedClassId(null)}>
        {['All', ...classCategories].map(category => (
            <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
                {isLoading ? Array.from({length: 6}).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-4">
                             <div className="flex-1 space-y-3">
                                 <Skeleton className="h-5 w-3/5 rounded" />
                                 <Skeleton className="h-4 w-4/5 rounded" />
                             </div>
                             <Skeleton className="h-10 w-10 rounded" />
                        </CardContent>
                    </Card>
                )) : filteredClasses(category).map((cls) => (
                    <ClassListItem key={cls.id} cls={cls} onClick={() => handleCardClick(cls.id)} />
                ))}
                </div>

                {!isLoading && filteredClasses(category).length === 0 && (
                    <div className="text-center text-muted-foreground pt-16">
                        No classes in this category yet.
                    </div>
                )}
            </TabsContent>
        ))}

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
       </Tabs>
    </>
  );
}

    