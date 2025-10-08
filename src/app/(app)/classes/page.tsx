
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, PlusCircle, Users } from 'lucide-react';
import { useCollection, useFirebase, useUser, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ClassDetailsContent from '@/components/class-details-content';


export default function ClassesPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
    const { data: classes, isLoading } = useCollection<any>(classesQuery);

    const handleAddClass = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newClassName.trim() && user) {
            const classesCollection = collection(firestore, 'users', user.uid, 'classes');
            addDocumentNonBlocking(classesCollection, {
                name: newClassName,
                students: [],
                subjects: []
            });
            setNewClassName('');
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
                Enter the name for the new class. You can add students and subjects later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClass}>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Class Name</Label>
                    <Input id="name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g., Primary 5A" className="col-span-3" />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? Array.from({length: 3}).map((_, i) => (
              <Card key={i}><CardContent className="h-48 bg-muted rounded-lg animate-pulse" /></Card>
          )) : classes?.map((cls) => (
            <SheetTrigger asChild key={cls.id}>
              <Card onClick={() => handleCardClick(cls.id)} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline">{cls.name}</CardTitle>
                  <CardDescription>A class for the current session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
            </SheetTrigger>
          ))}
        </div>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedClassId && <ClassDetailsContent classId={selectedClassId} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
