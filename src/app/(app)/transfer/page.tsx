
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
import { useCollection, useFirebase, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, where, serverTimestamp, writeBatch, doc, orderBy, getDoc, getDocs, addDoc, updateDoc, arrayUnion, setDoc, limit } from 'firebase/firestore';
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
  
  // Fetch incoming transfers
  const incomingTransfersQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'incomingTransfers'), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: incomingTransfers, isLoading: isLoadingIncoming } = useCollection<DataTransfer>(incomingTransfersQuery);
  
  // Fetch outgoing transfers
  const outgoingTransfersQuery = useMemoFirebase(
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
    return dataType === 'Class' ? (classes || []) : (students || []);
  }, [dataType, classes, students]);

  const getItemName = useCallback((itemId: string, type: DataType): string => {
    const items = type === 'Class' ? classes : students;
    return items?.find(item => item.id === itemId)?.name || 'Unknown';
  }, [classes, students]);

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
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('userCode', '==', recipientCode.trim().toUpperCase()), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error(`No user found with code: ${recipientCode.trim().toUpperCase()}`);
        }
        
        const recipientDoc = snapshot.docs[0];
        const recipient = { id: recipientDoc.id, code: recipientDoc.data().userCode };

        let dataToTransfer: any = {};
        let studentsToTransfer: any[] = [];
        const dataName = getItemName(dataItem, dataType);

        if (dataType === 'Class') {
            const classRef = doc(firestore, `users/${user.uid}/classes/${dataItem}`);
            const classSnap = await getDoc(classRef);
            if (classSnap.exists()) {
                dataToTransfer = classSnap.data();
                
                const studentsQueryRef = query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', dataItem));
                const studentsSnap = await getDocs(studentsQueryRef);
                studentsToTransfer = studentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            }
        }
        
        const outgoingTransferRef = doc(collection(firestore, `users/${user.uid}/outgoingTransfers`));
        const outgoingTransferId = outgoingTransferRef.id;

        const transferPayload = {
            dataType,
            dataId: dataItem,
            dataTransferred: dataName,
            fromUserId: user.uid,
            fromUserCode: userProfile.userCode,
            toUserId: recipient.id,
            toUserCode: recipient.code,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
            processedAt: null,
            data: dataToTransfer,
            students: studentsToTransfer,
        };

        // Batch write
        const batch = writeBatch(firestore);
        
        // 1. Set outgoing transfer
        batch.set(outgoingTransferRef, {
            ...transferPayload,
            outgoingTransferId: outgoingTransferId
        });

        // 2. Set incoming transfer
        const incomingTransferRef = doc(collection(firestore, `users/${recipient.id}/incomingTransfers`));
        batch.set(incomingTransferRef, {
            ...transferPayload,
            outgoingTransferId: outgoingTransferId, // Link to the sender's doc
        });

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

        if (transfer.dataType === 'Class' && transfer.data) {
            const newClassRef = doc(collection(firestore, 'users', user.uid, 'classes'));
            const newStudentIds: string[] = [];

            batch.set(newClassRef, {
                ...transfer.data,
                students: [], // Start with empty students array
                transferredFrom: transfer.fromUserId,
                transferredAt: serverTimestamp(),
            });

            if (transfer.students && transfer.students.length > 0) {
                for (const studentData of transfer.students) {
                    const newStudentRef = doc(collection(firestore, 'users', user.uid, 'students'));
                    batch.set(newStudentRef, {
                        ...studentData,
                        classId: newClassRef.id,
                        className: transfer.data.name,
                        transferredFrom: transfer.fromUserId,
                        transferredAt: serverTimestamp(),
                    });
                    newStudentIds.push(newStudentRef.id);
                }
            }
            batch.update(newClassRef, { students: newStudentIds });
        } else {
             toast({ variant: 'destructive', title: 'Invalid Data', description: 'Transfer data is missing or type is not supported.' });
             throw new Error('Invalid transfer data');
        }
        
        const timestamp = serverTimestamp();
        // Update recipient's incoming transfer
        const incomingRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
        batch.update(incomingRef, { status: 'accepted', processedAt: timestamp });
        
        // Update sender's outgoing transfer
        const outgoingRef = doc(firestore, 'users', transfer.fromUserId, 'outgoingTransfers', transfer.outgoingTransferId);
        batch.update(outgoingRef, { status: 'accepted', processedAt: timestamp });

        await batch.commit();

        toast({
            title: 'Transfer Accepted',
            description: `Class "${transfer.dataTransferred}" has been added to your account.`,
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

      // Update recipient's incoming transfer
      const incomingRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
      batch.update(incomingRef, { status: 'rejected', processedAt: timestamp });
      
      // Update sender's outgoing transfer
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
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>A log of your recent sent, incoming and processed data transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ))
              ) : combinedTransfers.length > 0 ? (
                combinedTransfers.map((transfer) => {
                  const isProcessing = processingTransferId === transfer.id;
                  const isSent = transfer.type === 'sent';
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell><Badge variant={isSent ? 'secondary' : 'default'}>{isSent ? 'Sent' : 'Received'}</Badge></TableCell>
                      <TableCell className="font-mono">{isSent ? transfer.toUserCode : transfer.fromUserCode}</TableCell>
                      <TableCell>{transfer.dataType}</TableCell>
                      <TableCell>{transfer.dataTransferred}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transfer.createdAt ? formatDistanceToNow(new Date(transfer.createdAt.seconds * 1000), { addSuffix: true }) : '...'}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isSent && transfer.status === 'pending' && (
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
                <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No transfer history.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, transfer: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.action === 'accept' ? 'Accept Transfer?' : 'Reject Transfer?'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {confirmDialog.action === 'accept' ? (
                  <>
                    You are about to accept <strong>{confirmDialog.transfer?.dataTransferred}</strong> from <strong>{confirmDialog.transfer?.fromUserCode}</strong>. This data will be copied to your account.
                    {confirmDialog.transfer?.dataType === 'Class' && (
                      <span className="mt-2 flex items-start gap-2 text-yellow-600 dark:text-yellow-500">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">This will copy the class and all its students into your records.</span>
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
            >
              {confirmDialog.action === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
