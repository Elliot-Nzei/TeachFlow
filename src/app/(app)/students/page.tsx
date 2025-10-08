import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderStudents } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function StudentsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold font-headline mb-8">All Students</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {placeholderStudents.map((student) => (
          <Link href={`/students/${student.id}`} key={student.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatarUrl} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold">{student.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{student.class}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
