
'use client';

import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';
import type { Class } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

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
    <aside className="w-full md:w-64 flex-shrink-0 border-r h-full flex flex-col">
        <div className="p-4 border-b">
            <h1 className="text-2xl font-bold font-headline">Classes</h1>
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
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
    </aside>
  );
}
