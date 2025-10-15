
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebase, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Class, Timetable, TimetableSchedule, TimetablePeriod } from '@/lib/types';
import { PlusCircle, Trash2, Edit, Clock } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  "08:00", "08:40", "09:20", "10:00", "10:40", "11:20", "12:00", "12:40", "13:20", "14:00"
];

type TimetableGridProps = {
  selectedClass: Class;
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
  onTimetableLoad: (timetable: Timetable | null) => void;
  viewMode?: 'desktop' | 'mobile' | 'print';
};

export default function TimetableGrid({ selectedClass, isSheetOpen, setIsSheetOpen, onTimetableLoad, viewMode }: TimetableGridProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<TimetableSchedule>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<{ day: string; period?: TimetablePeriod; index?: number } | null>(null);
  const isMobile = useIsMobile();
  const currentView = viewMode || (isMobile ? 'mobile' : 'desktop');
  
  const timetableQuery = useMemoFirebase(() => 
    (user && selectedClass) 
    ? doc(firestore, 'users', user.uid, 'timetables', selectedClass.id) 
    : null, 
  [firestore, user, selectedClass]);
  
  const { data: timetableData, isLoading } = useDoc<Timetable>(timetableQuery);

  useEffect(() => {
    const initialSchedule = daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
    if (timetableData) {
      setSchedule(timetableData.schedule || initialSchedule);
      onTimetableLoad(timetableData);
    } else {
      setSchedule(initialSchedule);
      onTimetableLoad(null);
    }
  }, [timetableData, onTimetableLoad]);

  const handleAddPeriodClick = (day: string) => {
    setEditingPeriod({ day });
    setIsDialogOpen(true);
  };
  
  const handleEditPeriodClick = (day: string, period: TimetablePeriod, index: number) => {
    setEditingPeriod({ day, period, index });
    setIsDialogOpen(true);
  };
  
  const handleRemovePeriod = (day: string, index: number) => {
    setSchedule(prevSchedule => {
        const newSchedule = { ...prevSchedule };
        const daySchedule = [...(newSchedule[day as keyof TimetableSchedule] || [])];
        daySchedule.splice(index, 1);
        newSchedule[day as keyof TimetableSchedule] = daySchedule;
        return newSchedule;
    });
  };

  const handleSavePeriod = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPeriod: TimetablePeriod = {
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      subject: formData.get('subject') as string,
    };

    if (!editingPeriod || !newPeriod.startTime || !newPeriod.endTime || !newPeriod.subject) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    setSchedule(prevSchedule => {
        const newSchedule = { ...prevSchedule };
        const daySchedule = [...(newSchedule[editingPeriod.day as keyof TimetableSchedule] || [])];
        
        if (editingPeriod.index !== undefined) {
          daySchedule[editingPeriod.index] = newPeriod;
        } else {
          daySchedule.push(newPeriod);
        }

        daySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

        newSchedule[editingPeriod.day as keyof TimetableSchedule] = daySchedule;
        return newSchedule;
    });

    setIsDialogOpen(false);
    setEditingPeriod(null);
  };

  const handleSaveChanges = () => {
    if (!user || !selectedClass) return;

    const timetableRef = doc(firestore, 'users', user.uid, 'timetables', selectedClass.id);
    const dataToSave: Timetable = {
      id: selectedClass.id,
      classId: selectedClass.id,
      className: selectedClass.name,
      schedule,
    };
    
    setDocumentNonBlocking(timetableRef, dataToSave, { merge: true });
    toast({ title: 'Success', description: 'Timetable saved successfully.' });
    setIsSheetOpen(false);
  };

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  return (
    <>
      {/* Desktop Grid View */}
      {currentView !== 'mobile' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs xl:text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border font-semibold w-24">Time</th>
                {daysOfWeek.map(day => (
                  <th key={day} className="p-2 border font-semibold min-w-[120px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.slice(0, -1).map((startTime, index) => {
                const endTime = timeSlots[index + 1];
                return (
                  <tr key={startTime}>
                    <td className="p-2 border text-center font-medium text-muted-foreground">{`${startTime} - ${endTime}`}</td>
                    {daysOfWeek.map(day => {
                      const period = schedule[day as keyof TimetableSchedule]?.find(p => p.startTime === startTime);
                      return (
                        <td key={`${day}-${startTime}`} className="p-1 border align-top h-16">
                          {period ? (
                            <div className="bg-primary/10 text-primary p-2 rounded-md h-full text-center flex flex-col justify-center">
                              <p className="font-bold">{period.subject}</p>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      {currentView === 'mobile' && (
        <div className="space-y-3">
          {daysOfWeek.map(day => (
              <Card key={day}>
                  <CardHeader className="p-4">
                      <CardTitle className="text-base">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                          {(schedule[day as keyof TimetableSchedule] || []).length > 0 ? (
                          [...(schedule[day as keyof TimetableSchedule] || [])]
                            .sort((a,b) => a.startTime.localeCompare(b.startTime))
                            .map((period, index) => (
                              <div key={index} className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-mono text-sm">{period.startTime}</span>
                                  </div>
                                  <div className="flex-1 font-semibold text-secondary-foreground">
                                      {period.subject}
                                  </div>
                              </div>
                          ))
                          ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No periods scheduled for {day}.</p>
                          )}
                      </div>
                  </CardContent>
              </Card>
          ))}
        </div>
      )}
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-2xl sm:w-3/4 flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Timetable for {selectedClass.name}</SheetTitle>
            <SheetDescription>Add, edit, or remove periods for each day of the week.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <Accordion type="multiple" className="w-full space-y-4">
              {daysOfWeek.map(day => (
                <AccordionItem value={day} key={day} className="border-b-0">
                    <Card>
                        <AccordionTrigger className="p-4 hover:no-underline">
                             <CardTitle className="text-lg">{day}</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                             <div className="space-y-2">
                                {[...(schedule[day as keyof TimetableSchedule] || [])]
                                .sort((a,b) => a.startTime.localeCompare(b.startTime))
                                .map((period, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                                    <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <span className="font-mono text-xs text-muted-foreground">{period.startTime} - {period.endTime}</span>
                                    </div>
                                    <span className="font-semibold">{period.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditPeriodClick(day, period, index)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemovePeriod(day, index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </div>
                                </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => handleAddPeriodClick(day)} className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Period
                                </Button>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriod?.period ? 'Edit' : 'Add'} Period for {editingPeriod?.day}</DialogTitle>
            <DialogDescription>Select the time slot and subject for this period.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePeriod}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select name="startTime" defaultValue={editingPeriod?.period?.startTime}>
                    <SelectTrigger id="startTime"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(0,-1).map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                   <Select name="endTime" defaultValue={editingPeriod?.period?.endTime}>
                    <SelectTrigger id="endTime"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(1).map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select name="subject" defaultValue={editingPeriod?.period?.subject}>
                  <SelectTrigger id="subject"><SelectValue placeholder="Select subject..." /></SelectTrigger>
                  <SelectContent>
                    {(selectedClass.subjects || []).map(subject => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Period</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
