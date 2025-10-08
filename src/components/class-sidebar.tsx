
'use client';

import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';
import type { Class } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface ClassSidebarProps {
  selectedClass: Class | null;
  onSelectClass: (cls: Class) => void;
}

export default function ClassSidebar({ selectedClass, onSelectClass }: ClassSidebarProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading } = useCollection<any>(classesQuery);
  
  return (
    <Card className="h-full">
        <CardHeader>
            <CardTitle className="font-headline">Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
            <ScrollArea className="h-[60vh]">
                <div className="space-y-1 p-2">
                    {isLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-9 w-full" />) :
                    classes?.map((cls) => (
                        <Button 
                            key={cls.id} 
                            variant={selectedClass?.id === cls.id ? 'secondary' : 'ghost'} 
                            className={cn(
                                "w-full justify-start",
                                selectedClass?.id === cls.id && "font-bold"
                            )}
                            onClick={() => onSelectClass(cls)}
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            {cls.name}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
