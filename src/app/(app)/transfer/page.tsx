
'use client';
import { useState, useMemo, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Check, X, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, writeBatch, doc, orderBy, getDoc, getDocs, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Class, DataTransfer, Student } from '@/lib/types';
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

type DataType = 'Class' | 'Grades' | 'Report Card';

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

  // Fetch classes and students
  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  // Fetch incoming transfers from the user's own subcollection
  const incomingTransfersQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'incomingTransfers'), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: incomingTransfers, isLoading: isLoadingTransfers } = useCollection<DataTransfer>(incomingTransfersQuery);

  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingProfile;

  const dataItemOptions = useMemo(() => {
    if (!dataType) return [];
    return dataType === 'Class' ? (classes || []) : (students || []);
  }, [dataType, classes, students]);

  const getItemName = useCallback((itemId: string, type: DataType): string => {
    const items = type === 'Class' ? classes : students;
    return items?.find(item => item.id === itemId)?.name || 'Unknown';
  }, [classes, students]);

  const findRecipientIdByUserCode = async (code: string): Promise<string | null> => {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('userCode', '==', code), where('userCode', '!=', userProfile?.userCode));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].id;
  };

  const handleTransfer = async () => {
    if (!recipientCode || !dataType || !dataItem || !user || !userProfile) {
      toast({ variant: 'destructive', title: 'Invalid Transfer', description: 'Please fill all fields.' });
      return;
    }
    if (recipientCode === userProfile.userCode) {
        toast({ variant: 'destructive', title: 'Invalid Recipient', description: 'You cannot transfer data to yourself.' });
        return;
    }

    setIsTransferring(true);
    try {
      const recipientId = await findRecipientIdByUserCode(recipientCode.trim().toUpperCase());
      if (!recipientId) {
        throw new Error(`No user found with code: ${recipientCode.trim().toUpperCase()}`);
      }

      const dataName = getItemName(dataItem, dataType);
      const transferRequest = {
        fromUserCode: userProfile.userCode,
        fromUserId: user.uid,
        toUserId: recipientId,
        dataType,
        dataId: dataItem,
        dataTransferred: dataName,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
      };

      // Write the transfer request to the recipient's incomingTransfers collection
      const recipientTransfersRef = collection(firestore, 'users', recipientId, 'incomingTransfers');
      await addDoc(recipientTransfersRef, transferRequest);
      
      toast({
        title: 'Transfer Initiated',
        description: `Request to transfer "${dataName}" sent to ${recipientCode.trim().toUpperCase()}.`,
      });

      setRecipientCode('');
      setDataType('');
      setDataItem('');

    } catch (error) {
      console.error("Transfer error:", error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const copyClassData = async (fromUserId: string, toUserId: string, classId: string) => {
    const batch = writeBatch(firestore);
    const classRef = doc(firestore, 'users', fromUserId, 'classes', classId);
    const classSnap = await getDoc(classRef);
    if (!classSnap.exists()) throw new Error('Source class not found');
    const classData = classSnap.data();
    
    // Create the new class document with an empty students array initially
    const newClassRef = doc(collection(firestore, 'users', toUserId, 'classes'));
    batch.set(newClassRef, {
      ...classData,
      students: [], // CRITICAL: Start with an empty student list
      transferredFrom: fromUserId,
      transferredAt: serverTimestamp(),
    });

    // Find all students from the source class
    const studentsQuery = query(collection(firestore, 'users', fromUserId, 'students'), where('classId', '==', classId));
    const studentsSnap = await getDocs(studentsQuery);
    
    const newStudentIds: string[] = [];
    // Loop through source students, create new student docs for the recipient, and collect their new IDs
    studentsSnap.docs.forEach((studentDoc) => {
      const newStudentRef = doc(collection(firestore, 'users', toUserId, 'students'));
      batch.set(newStudentRef, {
        ...studentDoc.data(),
        classId: newClassRef.id, // Update student's classId to the new class
        className: classData.name,
        transferredFrom: fromUserId,
        transferredAt: serverTimestamp(),
      });
      newStudentIds.push(newStudentRef.id); // Collect the new student ID
    });

    // After all students are processed, update the new class with the array of new student IDs
    batch.update(newClassRef, { students: newStudentIds });

    // Commit all batched writes
    await batch.commit();
    return { studentsCount: studentsSnap.size };
  };

  const handleAcceptTransfer = async (transfer: DataTransfer) => {
    if (!user || !transfer.fromUserId) return;

    setProcessingTransferId(transfer.id);
    setConfirmDialog({ open: false, transfer: null, action: null });

    try {
      if (transfer.dataType === 'Class') {
        const { studentsCount } = await copyClassData(transfer.fromUserId, user.uid, transfer.dataId);
        toast({
          title: 'Transfer Accepted',
          description: `Class "${transfer.dataTransferred}" with ${studentsCount} student(s) added to your account.`,
        });
      } else {
        toast({ variant: 'destructive', title: 'Not Implemented', description: `Transfer for ${transfer.dataType} is not yet supported.` });
        throw new Error('Unsupported data type');
      }

      const transferRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
      await updateDoc(transferRef, { status: 'accepted', processedAt: serverTimestamp() });

    } catch (error) {
      console.error('Error accepting transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'Failed to accept transfer.',
      });
    } finally {
      setProcessingTransferId(null);
    }
  };

  const handleRejectTransfer = async (transfer: DataTransfer) => {
    if (!user) return;
    setProcessingTransferId(transfer.id);
    setConfirmDialog({ open: false, transfer: null, action: null });

    try {
      const transferRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
      await updateDoc(transferRef, { status: 'rejected', processedAt: serverTimestamp() });

      toast({
        title: 'Transfer Rejected',
        description: `Transfer from ${transfer.fromUserCode} has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reject transfer.' });
    } finally {
      setProcessingTransferId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
      case 'accepted': return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">Accepted</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Data Transfer</h1>
        <p className="text-muted-foreground">Securely transfer data to another user with their unique code.</p>
      </div>

      {userProfile?.userCode && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your User Code</p>
                <p className="text-2xl font-bold font-mono">{userProfile.userCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(userProfile.userCode!);
                  toast({ title: 'Copied!', description: 'User code copied to clipboard.' });
                }}
              >
                Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Initiate a New Transfer</CardTitle>
          <CardDescription>Enter the recipient's code and select the data you wish to send.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recipient-code">Recipient's User Code</Label>
              <Input id="recipient-code" placeholder="NSMS-XXXXX" value={recipientCode} onChange={e => setRecipientCode(e.target.value.toUpperCase())} disabled={isTransferring} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select onValueChange={(v: DataType) => { setDataType(v); setDataItem(''); }} value={dataType} disabled={isTransferring || isLoading}>
                <SelectTrigger id="data-type"><SelectValue placeholder="Select data type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class">Class Data (with students)</SelectItem>
                  <SelectItem value="Grades" disabled>Student Grades (Coming Soon)</SelectItem>
                  <SelectItem value="Report Card" disabled>Student Report Card (Coming Soon)</SelectItem>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Incoming & Completed Transfers</CardTitle>
          <CardDescription>A log of your recent incoming and processed data transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransfers ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ))
              ) : incomingTransfers && incomingTransfers.length > 0 ? (
                incomingTransfers.map((transfer) => {
                  const isProcessing = processingTransferId === transfer.id;
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-mono">{transfer.fromUserCode}</TableCell>
                      <TableCell>{transfer.dataType}</TableCell>
                      <TableCell>{transfer.dataTransferred}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transfer.createdAt ? formatDistanceToNow(new Date(transfer.createdAt.seconds * 1000), { addSuffix: true }) : '...'}
                      </TableCell>
                      <TableCell className="text-right">
                        {transfer.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, transfer, action: 'accept' })} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, transfer, action: 'reject' })} disabled={isProcessing}>
                              <X className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No incoming transfers.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, transfer: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.action === 'accept' ? 'Accept Transfer?' : 'Reject Transfer?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'accept' ? (
                <>
                  You are about to accept <strong>{confirmDialog.transfer?.dataTransferred}</strong> from <strong>{confirmDialog.transfer?.fromUserCode}</strong>. This data will be copied to your account.
                  {confirmDialog.transfer?.dataType === 'Class' && (
                    <div className="mt-2 flex items-start gap-2 text-yellow-600 dark:text-yellow-500">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">This will copy the class and all its students into your records.</span>
                    </div>
                  )}
                </>
              ) : (
                <>Are you sure you want to reject this transfer? This action cannot be undone.</>
              )}
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
            >
              {confirmDialog.action === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
