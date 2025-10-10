
'use client';
import { useState, useMemo, useContext, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, Check, X, AlertCircle, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, where, serverTimestamp, writeBatch, doc, orderBy, getDoc, getDocs, addDoc, updateDoc, arrayUnion, setDoc, limit } from 'firebase/firestore';
import type { Class, DataTransfer, Student, Grade, LessonNote, Attendance, Trait } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsContext } from '@/contexts/settings-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DataType = 'Full Class Data' | 'Single Student Record' | 'Lesson Note';

export default function TransferPage() {
  const { firestore, user } = useFirebase();
  const { settings: userProfile, isLoading: isLoadingProfile } = useContext(SettingsContext);
  const { toast } = useToast();
  
  const [recipientCode, setRecipientCode] = useState('');
  const [dataType, setDataType] = useState<DataType | ''>('');
  const [dataItem, setDataItem] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [processingTransferId, setProcessingTransferId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ 
    open: boolean; 
    transfer: DataTransfer | null; 
    action: 'accept' | 'reject' | null;
  }>({ open: false, transfer: null, action: null });
  const [lessonNotesHistory, setLessonNotesHistory] = useState<LessonNote[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedNotes = localStorage.getItem('lessonNotesHistory');
        if (storedNotes) {
            setLessonNotesHistory(JSON.parse(storedNotes));
        }
    }
  }, []);

  const classesQuery = useMemo(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const studentsQuery = useMemo(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  const incomingTransfersQuery = useMemo(
    () => user ? query(collection(firestore, 'users', user.uid, 'incomingTransfers'), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: incomingTransfers, isLoading: isLoadingIncoming } = useCollection<DataTransfer>(incomingTransfersQuery);
  
  const outgoingTransfersQuery = useMemo(
    () => user ? query(collection(firestore, 'users', user.uid, 'outgoingTransfers'), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: outgoingTransfers, isLoading: isLoadingOutgoing } = useCollection<DataTransfer>(outgoingTransfersQuery);

  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingProfile || isLoadingIncoming || isLoadingOutgoing;

  const combinedTransfers = useMemo(() => {
    const allTransfers = [
      ...(incomingTransfers || []).map(t => ({ ...t, type: 'received' as const })),
      ...(outgoingTransfers || []).map(t => ({ ...t, type: 'sent' as const })),
    ];
    allTransfers.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
    });
    return allTransfers;
  }, [incomingTransfers, outgoingTransfers]);


  const dataItemOptions = useMemo(() => {
    if (!dataType) return [];
    if (dataType === 'Full Class Data') return (classes || []);
    if (dataType === 'Single Student Record') return (students || []);
    if (dataType === 'Lesson Note') return lessonNotesHistory.map(ln => ({ id: ln.id, name: `${ln.formState.subject} - ${new Date(ln.timestamp).toLocaleDateString()}`}));
    return [];
  }, [dataType, classes, students, lessonNotesHistory]);

  const getItemName = useCallback((itemId: string, type: DataType): string => {
    let items;
    if (type === 'Full Class Data') items = classes;
    else if (type === 'Single Student Record') items = students;
    else if (type === 'Lesson Note') return lessonNotesHistory.find(ln => ln.id === itemId)?.formState.subject || 'Unknown Lesson';
    
    return items?.find(item => item.id === itemId)?.name || 'Unknown';
  }, [classes, students, lessonNotesHistory]);

  const handleTransfer = async () => {
    if (!recipientCode || !dataType || !dataItem || !user || !userProfile || !userProfile.currentSession) {
      toast({ variant: 'destructive', title: 'Invalid Transfer', description: 'Please fill all fields and ensure session is set.' });
      return;
    }
    if (recipientCode === userProfile.userCode) {
        toast({ variant: 'destructive', title: 'Invalid Recipient', description: 'You cannot transfer data to yourself.' });
        return;
    }

    setIsTransferring(true);
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('userCode', '==', recipientCode.trim().toUpperCase()), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error(`No user found with code: ${recipientCode.trim().toUpperCase()}`);
        }
        
        const recipientDoc = snapshot.docs[0];
        const recipient = { id: recipientDoc.id, code: recipientDoc.data().userCode };

        let payload: Partial<DataTransfer> = {};
        const dataName = getItemName(dataItem, dataType);

        const session = userProfile.currentSession;
        const term = userProfile.currentTerm;

        if (dataType === 'Full Class Data') {
            const classRef = doc(firestore, `users/${user.uid}/classes/${dataItem}`);
            const classSnap = await getDoc(classRef);
            if (!classSnap.exists()) throw new Error('Selected class not found.');
            
            payload.data = classSnap.data();

            const studentsInClassQuery = query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', dataItem));
            const studentsSnap = await getDocs(studentsInClassQuery);
            payload.students = studentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
            
            const studentIds = studentsSnap.docs.map(doc => doc.id);
            if (studentIds.length > 0) {
              const gradesQuery = query(collection(firestore, 'users', user.uid, 'grades'), where('studentId', 'in', studentIds), where('session', '==', session));
              const gradesSnap = await getDocs(gradesQuery);
              payload.grades = gradesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Grade));

              const attendanceQuery = query(collection(firestore, 'users', user.uid, 'attendance'), where('studentId', 'in', studentIds), where('session', '==', session));
              const attendanceSnap = await getDocs(attendanceQuery);
              payload.attendance = attendanceSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Attendance));

              const traitsQuery = query(collection(firestore, 'users', user.uid, 'traits'), where('studentId', 'in', studentIds), where('session', '==', session));
              const traitsSnap = await getDocs(traitsQuery);
              payload.traits = traitsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trait));
            }

        } else if (dataType === 'Single Student Record') {
            const studentRef = doc(firestore, `users/${user.uid}/students/${dataItem}`);
            const studentSnap = await getDoc(studentRef);
            if (!studentSnap.exists()) throw new Error('Selected student not found.');
            payload.data = studentSnap.data();

            const gradesQuery = query(collection(firestore, 'users', user.uid, 'grades'), where('studentId', '==', dataItem), where('session', '==', session));
            const gradesSnap = await getDocs(gradesQuery);
            payload.grades = gradesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Grade));

            const attendanceQuery = query(collection(firestore, 'users', user.uid, 'attendance'), where('studentId', '==', dataItem), where('session', '==', session));
            const attendanceSnap = await getDocs(attendanceQuery);
            payload.attendance = attendanceSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Attendance));

            const traitsQuery = query(collection(firestore, 'users', user.uid, 'traits'), where('studentId', '==', dataItem), where('session', '==', session));
            const traitsSnap = await getDocs(traitsQuery);
            payload.traits = traitsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trait));

        } else if (dataType === 'Lesson Note') {
            const note = lessonNotesHistory.find(n => n.id === dataItem);
            if (!note) throw new Error('Selected lesson note not found.');
            payload.lessonNote = note;
        }
        
        const outgoingTransferRef = doc(collection(firestore, `users/${user.uid}/outgoingTransfers`));
        const outgoingTransferId = outgoingTransferRef.id;

        const transferPayload: Omit<DataTransfer, 'id' | 'createdAt' | 'processedAt'> = {
            dataType,
            dataId: dataItem,
            dataTransferred: dataName,
            fromUserId: user.uid,
            fromUserCode: userProfile.userCode,
            toUserId: recipient.id,
            toUserCode: recipient.code,
            status: 'pending' as const,
            outgoingTransferId: outgoingTransferId,
            ...payload
        };

        const batch = writeBatch(firestore);
        
        batch.set(outgoingTransferRef, { ...transferPayload, createdAt: serverTimestamp() });
        const incomingTransferRef = doc(collection(firestore, `users/${recipient.id}/incomingTransfers`));
        batch.set(incomingTransferRef, { ...transferPayload, createdAt: serverTimestamp() });

        await batch.commit();
      
        toast({
            title: 'Transfer Initiated',
            description: `Request to transfer "${dataName}" sent to ${recipientCode.trim().toUpperCase()}.`,
        });

        setRecipientCode('');
        setDataType('');
        setDataItem('');

    } catch (error) {
          toast({
              variant: 'destructive',
              title: 'Transfer Failed',
              description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAcceptTransfer = async (transfer: DataTransfer) => {
    if (!user || !transfer.fromUserId || !transfer.outgoingTransferId) return;

    setProcessingTransferId(transfer.id);
    setConfirmDialog({ open: false, transfer: null, action: null });
    
    try {
        const batch = writeBatch(firestore);

        if (transfer.dataType === 'Full Class Data' && transfer.data) {
            const newClassRef = doc(collection(firestore, 'users', user.uid, 'classes'));
            const newStudentIds: string[] = [];

            batch.set(newClassRef, { ...transfer.data, students: [], transferredFrom: transfer.fromUserId, transferredAt: serverTimestamp() });

            if (transfer.students) {
                for (const student of transfer.students) {
                    const newStudentRef = doc(collection(firestore, 'users', user.uid, 'students'));
                    batch.set(newStudentRef, { ...student, classId: newClassRef.id, className: transfer.data.name });
                    newStudentIds.push(newStudentRef.id);
                }
            }
            batch.update(newClassRef, { students: newStudentIds });

        } else if (transfer.dataType === 'Single Student Record' && transfer.data) {
             const newStudentRef = doc(collection(firestore, 'users', user.uid, 'students'));
             batch.set(newStudentRef, { ...transfer.data, transferredFrom: transfer.fromUserId, transferredAt: serverTimestamp() });
        
        } else if (transfer.dataType === 'Lesson Note' && transfer.lessonNote) {
            const currentHistory = JSON.parse(localStorage.getItem('lessonNotesHistory') || '[]');
            const newHistory = [transfer.lessonNote, ...currentHistory].slice(0, 20);
            localStorage.setItem('lessonNotesHistory', JSON.stringify(newHistory));
            setLessonNotesHistory(newHistory);
        } else {
             throw new Error('Invalid transfer data');
        }
        
        if (transfer.grades) {
          for (const grade of transfer.grades) {
            const newGradeRef = doc(collection(firestore, 'users', user.uid, 'grades'));
            batch.set(newGradeRef, { ...grade, transferredFrom: transfer.fromUserId });
          }
        }
        if (transfer.attendance) {
          for (const att of transfer.attendance) {
            const newAttRef = doc(collection(firestore, 'users', user.uid, 'attendance'));
            batch.set(newAttRef, { ...att, transferredFrom: transfer.fromUserId });
          }
        }
        if (transfer.traits) {
          for (const trait of transfer.traits) {
            const newTraitRef = doc(collection(firestore, 'users', user.uid, 'traits'));
            batch.set(newTraitRef, { ...trait, transferredFrom: transfer.fromUserId });
          }
        }
        
        const timestamp = serverTimestamp();
        const incomingRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
        batch.update(incomingRef, { status: 'accepted', processedAt: timestamp });
        
        const outgoingRef = doc(firestore, 'users', transfer.fromUserId, 'outgoingTransfers', transfer.outgoingTransferId);
        batch.update(outgoingRef, { status: 'accepted', processedAt: timestamp });

        await batch.commit();

        toast({
            title: 'Transfer Accepted',
            description: `Data for "${transfer.dataTransferred}" has been added to your account.`,
        });

    } catch(error) {
        console.error('Accept transfer error:', error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to accept transfer",
            variant: "destructive",
        });
    } finally {
        setProcessingTransferId(null);
    }
  };

  const handleRejectTransfer = async (transfer: DataTransfer) => {
    if (!user || !transfer.fromUserId || !transfer.outgoingTransferId) return;
    setProcessingTransferId(transfer.id);
    setConfirmDialog({ open: false, transfer: null, action: null });

    try {
      const batch = writeBatch(firestore);
      const timestamp = serverTimestamp();

      const incomingRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
      batch.update(incomingRef, { status: 'rejected', processedAt: timestamp });
      
      const outgoingRef = doc(firestore, 'users', transfer.fromUserId, 'outgoingTransfers', transfer.outgoingTransferId);
      batch.update(outgoingRef, { status: 'rejected', processedAt: timestamp });

      await batch.commit();

      toast({
        title: 'Transfer Rejected',
        description: `Transfer from ${transfer.fromUserCode} has been rejected.`,
      });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to reject transfer.' });
    } finally {
      setProcessingTransferId(null);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Pending</Badge>;
      case 'accepted': return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Accepted</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const TransferHistoryItem = ({ transfer }: { transfer: DataTransfer & {type: 'sent' | 'received'} }) => {
    const isProcessing = processingTransferId === transfer.id;
    const isSent = transfer.type === 'sent';

    return (
        <Card>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSent ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                        {isSent ? <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />}
                    </div>
                    <div className="grid gap-1 flex-1">
                        <p className="font-semibold">{transfer.dataTransferred}</p>
                        <p className="text-sm text-muted-foreground">
                            {isSent ? `To: ${transfer.toUserCode}` : `From: ${transfer.fromUserCode}`} • <span className="font-mono text-xs">{transfer.dataType}</span>
                        </p>
                    </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:items-end md:text-right gap-2">
                    {getStatusBadge(transfer.status)}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {transfer.createdAt ? formatDistanceToNow(new Date(transfer.createdAt.seconds * 1000), { addSuffix: true }) : '...'}
                    </div>
                </div>

                {!isSent && transfer.status === 'pending' && (
                  <div className="flex w-full md:w-auto justify-end gap-2 border-t md:border-none pt-4 md:pt-0">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, transfer, action: 'accept' })} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, transfer, action: 'reject' })} disabled={isProcessing}>
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Data Transfer</h1>
        <p className="text-muted-foreground">Securely transfer data to another user with their unique code.</p>
      </div>

      {userProfile?.userCode && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Unique Transfer Code</p>
                <p className="text-2xl font-bold font-mono">{userProfile.userCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(userProfile.userCode!);
                  toast({ title: 'Copied!', description: 'Your transfer code has been copied to clipboard.' });
                }}
              >
                Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    <Tabs defaultValue="new-transfer">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-transfer">New Transfer</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="new-transfer">
            <Card>
                <CardHeader>
                <CardTitle>Initiate a New Transfer</CardTitle>
                <CardDescription>Enter the recipient's code and select the data you wish to send.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="recipient-code">Recipient's User Code</Label>
                    <Input id="recipient-code" placeholder="NSMS-XXXXX" value={recipientCode} onChange={e => setRecipientCode(e.target.value.toUpperCase())} disabled={isTransferring} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="data-type">Data Type</Label>
                        <Select onValueChange={(v: DataType) => { setDataType(v); setDataItem(''); }} value={dataType} disabled={isTransferring || isLoading}>
                            <SelectTrigger id="data-type"><SelectValue placeholder="Select data type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full Class Data">Full Class Data</SelectItem>
                                <SelectItem value="Single Student Record">Single Student Record</SelectItem>
                                <SelectItem value="Lesson Note">Lesson Note History</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="data-item">Specific Item</Label>
                        <Select onValueChange={setDataItem} value={dataItem} disabled={!dataType || isTransferring || isLoading}>
                            <SelectTrigger id="data-item"><SelectValue placeholder={isLoading ? "Loading..." : "Select item"} /></SelectTrigger>
                            <SelectContent>
                            {dataItemOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                </CardContent>
                <CardFooter>
                <Button onClick={handleTransfer} disabled={isTransferring || !recipientCode || !dataType || !dataItem || isLoading}>
                    {isTransferring ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Transfer Request</>}
                </Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="history">
            <Card>
                <CardHeader>
                <CardTitle>Transfer History</CardTitle>
                <CardDescription>A log of your recent sent and received data transfers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={`skeleton-${i}`} className="h-20 w-full" />
                    ))
                ) : combinedTransfers.length > 0 ? (
                    combinedTransfers.map((transfer) => (
                        <TransferHistoryItem key={transfer.id} transfer={transfer} />
                    ))
                ) : (
                    <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                        <p>No transfer history yet.</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, transfer: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.action === 'accept' ? 'Accept Transfer?' : 'Reject Transfer?'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {confirmDialog.action === 'accept' ? (
                  <>
                    You are about to accept <strong>{confirmDialog.transfer?.dataTransferred}</strong> from <strong>{confirmDialog.transfer?.fromUserCode}</strong>. This data will be copied to your account.
                    {confirmDialog.transfer?.dataType === 'Full Class Data' && (
                      <span className="mt-2 flex items-start gap-2 text-yellow-600 dark:text-yellow-500">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">This will copy the class and all its associated data into your records.</span>
                      </span>
                    )}
                  </>
                ) : (
                  <>Are you sure you want to reject this transfer? This action cannot be undone.</>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDialog.transfer) return;
                if (confirmDialog.action === 'accept') handleAcceptTransfer(confirmDialog.transfer);
                else handleRejectTransfer(confirmDialog.transfer);
              }}
              className={confirmDialog.action === 'accept' ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {confirmDialog.action === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
