import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { placeholderClasses } from '@/lib/placeholder-data';
import { BookOpen, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';

export default function ClassesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Classes</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Enter the details for the new class. Add student and subject names separated by commas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Class Name</Label>
                <Input id="name" placeholder="e.g., Primary 5A" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="students" className="text-right">Students</Label>
                <Textarea id="students" placeholder="Ada Okoro, Bolu Adebayo..." className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjects" className="text-right">Subjects</Label>
                <Textarea id="subjects" placeholder="Mathematics, English..." className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {placeholderClasses.map((cls) => (
          <Card key={cls.id}>
            <CardHeader>
              <CardTitle className="font-headline">{cls.name}</CardTitle>
              <CardDescription>A class for the current session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{cls.students.length} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{cls.subjects.length} Subjects</span>
                </div>
            </CardContent>
            <CardFooter>
              <Link href={`/classes/${cls.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
