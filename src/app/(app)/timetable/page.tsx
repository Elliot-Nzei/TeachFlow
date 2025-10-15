
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit } from 'lucide-react';
import type { Class } from '@/lib/types';
import ClassSidebar from '@/components/class-sidebar';
import TimetableGrid from '@/components/timetable-grid';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PanelLeft } from 'lucide-react';

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setIsSidebarOpen(false);
  };
  
  return (
    <div className="flex flex-1 gap-8">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block md:w-1/4 lg:w-1/5">
        <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-4 md:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline">
                    <PanelLeft className="mr-2 h-4 w-4" /> Select Class
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Select Class</SheetTitle>
                    <SheetDescription className="sr-only">Choose a class from the list to manage its timetable.</SheetDescription>
                  </SheetHeader>
                    <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
                </SheetContent>
            </Sheet>
            {selectedClass && <h2 className="font-bold text-lg truncate">{selectedClass.name}</h2>}
        </div>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">
                {selectedClass ? `${selectedClass.name} - Timetable` : 'Timetable'}
              </CardTitle>
              <CardDescription>
                {selectedClass ? 'Weekly schedule of subjects and periods.' : 'Select a class to view its timetable.'}
              </CardDescription>
            </div>
            {selectedClass && (
              <Button onClick={() => setIsSheetOpen(true)} size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Schedule
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedClass ? (
              <TimetableGrid 
                selectedClass={selectedClass} 
                isSheetOpen={isSheetOpen}
                setIsSheetOpen={setIsSheetOpen}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground rounded-lg border border-dashed">
                <CalendarDays className="h-16 w-16 mb-4 opacity-20" />
                <p>Please select a class from the sidebar to view or edit its timetable.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
