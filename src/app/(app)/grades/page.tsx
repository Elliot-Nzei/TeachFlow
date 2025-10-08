import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { placeholderClasses, placeholderGrades } from '@/lib/placeholder-data';
import { PlusCircle } from 'lucide-react';

export default function GradesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Grades Management</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
        </Button>
      </div>
      <Tabs defaultValue={placeholderClasses[0].name} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            {placeholderClasses.map((cls) => (
                <TabsTrigger key={cls.id} value={cls.name}>{cls.name}</TabsTrigger>
            ))}
        </TabsList>
        {placeholderClasses.map((cls) => (
            <TabsContent key={cls.id} value={cls.name}>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="text-right">Grade</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {placeholderGrades[cls.name]?.length > 0 ? (
                                placeholderGrades[cls.name].map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">{grade.studentName}</TableCell>
                                        <TableCell>{grade.subject}</TableCell>
                                        <TableCell>{grade.score}</TableCell>
                                        <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No grades recorded for this class yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
