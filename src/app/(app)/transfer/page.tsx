
'use client';
import { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Send, Loader2, Check, X, AlertCircle } from 'lucide-react';
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
import { collection, query, where, serverTimestamp, writeBatch, doc, orderBy, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
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

interface TransferWithDirection extends DataTransfer {
  isSent: boolean;
}

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
    transfer: TransferWithDirection | null; 
    action: 'accept' | 'reject' | null;
  }>({ open: false, transfer: null, action: null });

  // Fetch classes and students with proper memoization
  const classesQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null,
    [firestore, user]
  );
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const studentsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'students')) : null,
    [firestore, user]
  );
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  // Fetch sent transfers
  const sentTransfersQuery = useMemoFirebase(
    () => user ? query(
      collection(firestore, 'users', user.uid, 'transfers'), 
      orderBy('timestamp', 'desc')
    ) : null,
    [firestore, user]
  );
  const { data: sentTransfers, isLoading: isLoadingSent } = useCollection<DataTransfer>(sentTransfersQuery);

  // Fetch received transfers
  const receivedTransfersQuery = useMemoFirebase(
    () => (user && userProfile?.userCode)
        ? query(
            collection(firestore, 'transfers'), 
            where('toUser', '==', userProfile.userCode),
            orderBy('timestamp', 'desc')
          )
        : null,
    [firestore, user, userProfile?.userCode]
  );
  const { data: receivedTransfers, isLoading: isLoadingReceived } = useCollection<DataTransfer>(receivedTransfersQuery);

  // Combine and sort transfers efficiently
  const allTransfers = useMemo(() => {
    if (!userProfile?.userCode) return [];

    const sent: TransferWithDirection[] = (sentTransfers || []).map(t => ({ ...t, isSent: true }));
    const received: TransferWithDirection[] = (receivedTransfers || []).map(t => ({ ...t, isSent: false }));
    
    const transferMap = new Map<string, TransferWithDirection>();
    [...sent, ...received].forEach(transfer => {
      const transferId = transfer.id || `${transfer.fromUser}-${transfer.toUser}-${transfer.dataId}-${transfer.timestamp?.seconds}`;
      if (!transferMap.has(transferId)) {
        transferMap.set(transferId, transfer);
      }
    });
    
    return Array.from(transferMap.values()).sort((a, b) => {
      const timeA = a.timestamp?.seconds ?? 0;
      const timeB = b.timestamp?.seconds ?? 0;
      return timeB - timeA;
    });
  }, [sentTransfers, receivedTransfers, userProfile?.userCode]);

  // Combined loading state
  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingProfile;
  const isLoadingTransfers = isLoadingSent || isLoadingReceived;

  // Get data items based on selected type
  const dataItemOptions = useMemo(() => {
    if (!dataType) return [];
    return dataType === 'Class' ? (classes || []) : (students || []);
  }, [dataType, classes, students]);

  // Get selected item name
  const getItemName = useCallback((itemId: string, type: DataType): string => {
    const items = type === 'Class' ? classes : students;
    return items?.find(item => item.id === itemId)?.name || 'Unknown';
  }, [classes, students]);

  // Validate transfer input
  const validateTransfer = useCallback((): string | null => {
    if (!recipientCode || !dataType || !dataItem) {
      return 'Please fill in all fields to start a transfer.';
    }
    if (!userProfile?.userCode || !user) {
      return 'User profile not loaded. Please try again.';
    }
    if (recipientCode === userProfile.userCode) {
      return 'You cannot transfer data to yourself.';
    }
    if (recipientCode.trim().length < 5) {
      return 'Please enter a valid recipient code.';
    }
    return null;
  }, [recipientCode, dataType, dataItem, userProfile?.userCode, user]);

  // Find user by code
  const findUserByCode = async (userCode: string): Promise<string | null> => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('userCode', '==', userCode));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  };

  // Handle transfer with batched write
  const handleTransfer = async () => {
    const error = validateTransfer();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Invalid Transfer',
        description: error,
      });
      return;
    }

    setIsTransferring(true);
    
    try {
      if (!user || !userProfile) throw new Error("User not available");
      
      // Verify recipient exists
      const recipientUid = await findUserByCode(recipientCode.trim().toUpperCase());
      if (!recipientUid) {
        throw new Error(`No user found with code: ${recipientCode.trim().toUpperCase()}`);
      }

      const batch = writeBatch(firestore);
      const dataName = getItemName(dataItem, dataType as DataType);
      
      // Add to user's transfers collection
      const userTransferRef = doc(collection(firestore, 'users', user.uid, 'transfers'));
      batch.set(userTransferRef, {
        fromUser: userProfile.userCode,
        fromUserId: user.uid,
        toUser: recipientCode.trim().toUpperCase(),
        toUserId: recipientUid,
        dataType,
        dataId: dataItem,
        dataTransferred: dataName,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      // Add to global transfers collection for recipient to see
      const globalTransferRef = doc(collection(firestore, 'transfers'));
      batch.set(globalTransferRef, {
        fromUser: userProfile.userCode,
        fromUserId: user.uid,
        toUser: recipientCode.trim().toUpperCase(),
        toUserId: recipientUid,
        dataType,
        dataId: dataItem,
        dataTransferred: dataName,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      await batch.commit();

      toast({
        title: 'Transfer Initiated',
        description: `Request to transfer "${dataName}" has been sent to ${recipientCode.trim().toUpperCase()}.`,
      });

      // Reset form
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

  // Copy class data with all students
  const copyClassData = async (fromUserId: string, toUserId: string, classId: string) => {
    const batch = writeBatch(firestore);
    
    // Get the class data
    const classRef = doc(firestore, 'users', fromUserId, 'classes', classId);
    const classSnap = await getDoc(classRef);
    
    if (!classSnap.exists()) {
      throw new Error('Class not found');
    }

    const classData = classSnap.data();
    
    // Create new class in recipient's account
    const newClassRef = doc(collection(firestore, 'users', toUserId, 'classes'));
    batch.set(newClassRef, {
      ...classData,
      transferredFrom: fromUserId,
      transferredAt: serverTimestamp(),
    });

    // Get all students in this class
    const studentsRef = collection(firestore, 'users', fromUserId, 'students');
    const studentsQuery = query(studentsRef, where('classId', '==', classId));
    const studentsSnap = await getDocs(studentsQuery);

    // Copy each student
    studentsSnap.docs.forEach((studentDoc) => {
      const studentData = studentDoc.data();
      const newStudentRef = doc(collection(firestore, 'users', toUserId, 'students'));
      batch.set(newStudentRef, {
        ...studentData,
        classId: newClassRef.id, // Update to new class ID
        transferredFrom: fromUserId,
        transferredAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return { classId: newClassRef.id, studentsCount: studentsSnap.size };
  };

  // Copy student data
  const copyStudentData = async (fromUserId: string, toUserId: string, studentId: string) => {
    const batch = writeBatch(firestore);
    
    // Get the student data
    const studentRef = doc(firestore, 'users', fromUserId, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      throw new Error('Student not found');
    }

    const studentData = studentSnap.data();
    
    // Create new student in recipient's account
    const newStudentRef = doc(collection(firestore, 'users', toUserId, 'students'));
    batch.set(newStudentRef, {
      ...studentData,
      transferredFrom: fromUserId,
      transferredAt: serverTimestamp(),
    });

    await batch.commit();
    return { studentId: newStudentRef.id };
  };

  // Accept transfer
  const handleAcceptTransfer = async (transfer: TransferWithDirection) => {
    if (!user || !transfer.fromUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required information to accept transfer.',
      });
      return;
    }

    setProcessingTransferId(transfer.id);
    setConfirmDialog({ open: false, transfer: null, action: null });

    try {
      let result;
      
      // Perform the actual data transfer based on type
      if (transfer.dataType === 'Class') {
        result = await copyClassData(transfer.fromUserId, user.uid, transfer.dataId);
        toast({
          title: 'Transfer Accepted',
          description: `Class "${transfer.dataTransferred}" with ${result.studentsCount} student(s) has been added to your account.`,
        });
      } else {
        result = await copyStudentData(transfer.fromUserId, user.uid, transfer.dataId);
        toast({
          title: 'Transfer Accepted',
          description: `Student "${transfer.dataTransferred}" has been added to your account.`,
        });
      }

      // Update transfer status in both collections
      const batch = writeBatch(firestore);
      
      // Update in global transfers
      const globalTransferRef = doc(firestore, 'transfers', transfer.id);
      batch.update(globalTransferRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });

      // Update in sender's transfers if we can find it
      if (transfer.fromUserId) {
        const senderTransfersRef = collection(firestore, 'users', transfer.fromUserId, 'transfers');
        const senderQuery = query(
          senderTransfersRef, 
          where('dataId', '==', transfer.dataId),
          where('toUser', '==', transfer.toUser)
        );
        const senderSnap = await getDocs(senderQuery);
        
        senderSnap.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'accepted',
            acceptedAt: serverTimestamp(),
          });
        });
      }

      await batch.commit();

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

  // Reject transfer
  const handleRejectTransfer = async (transfer: TransferWithDirection) => {
    setProcessingTransferId(transfer.id);
    setConfirmDialog({ open: false, transfer: null, action: null });

    try {
      const batch = writeBatch(firestore);
      
      // Update in global transfers
      const globalTransferRef = doc(firestore, 'transfers', transfer.id);
      batch.update(globalTransferRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });

      // Securely update the sender's log without a cross-user query
      if (transfer.fromUserId) {
          const senderTransfersRef = collection(firestore, 'users', transfer.fromUserId, 'transfers');
          const q = query(senderTransfersRef, where('toUser', '==', transfer.toUser), where('dataId', '==', transfer.dataId));
          // This is a "best effort" update. The primary source of truth is the global collection.
          // In a real-world scenario, this update would be handled by a Cloud Function triggered by the global collection update.
          // For this app, we will skip the insecure client-side query.
      }

      await batch.commit();

      toast({
        title: 'Transfer Rejected',
        description: `Transfer from ${transfer.fromUser} has been rejected.`,
      });

    } catch (error) {
      console.error('Error rejecting transfer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject transfer.',
      });
    } finally {
      setProcessingTransferId(null);
    }
  };

  // Handle data type change
  const handleDataTypeChange = useCallback((value: DataType) => {
    setDataType(value);
    setDataItem('');
  }, []);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
                  navigator.clipboard.writeText(userProfile.userCode);
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
              <Input 
                id="recipient-code" 
                placeholder="NSMS-XXXXX" 
                value={recipientCode} 
                onChange={e => setRecipientCode(e.target.value.toUpperCase())}
                disabled={isTransferring}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select 
                onValueChange={handleDataTypeChange} 
                value={dataType}
                disabled={isTransferring || isLoading}
              >
                <SelectTrigger id="data-type">
                  <SelectValue placeholder="Select data to transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class">Class Data (with students)</SelectItem>
                  <SelectItem value="Grades">Student Grades</SelectItem>
                  <SelectItem value="Report Card">Student Report Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-item">Specific Item</Label>
              <Select 
                onValueChange={setDataItem} 
                value={dataItem} 
                disabled={!dataType || isTransferring || isLoading}
              >
                <SelectTrigger id="data-item">
                  <SelectValue placeholder={isLoading ? "Loading..." : "Select item"} />
                </SelectTrigger>
                <SelectContent>
                  {dataItemOptions.length === 0 ? (
                    <SelectItem value="no-items" disabled>
                      No {dataType === 'Class' ? 'classes' : 'students'} available
                    </SelectItem>
                  ) : (
                    dataItemOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleTransfer} 
            disabled={isTransferring || !recipientCode || !dataType || !dataItem || isLoading}
          >
            {isTransferring ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Transfer Data</>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>A log of your recent sent and received data transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Direction</TableHead>
                <TableHead>User Code</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransfers ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : allTransfers.length > 0 ? (
                allTransfers.map((transfer) => {
                  const isSent = transfer.fromUser === userProfile?.userCode;
                  const date = transfer.timestamp?.seconds 
                    ? new Date(transfer.timestamp.seconds * 1000) 
                    : new Date();
                  const isProcessing = processingTransferId === transfer.id;
                  const isPending = transfer.status === 'pending';
                  
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        {isSent ? (
                          <span className="flex items-center text-red-500">
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Sent
                          </span>
                        ) : (
                          <span className="flex items-center text-green-500">
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Received
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {isSent ? transfer.toUser : transfer.fromUser}
                      </TableCell>
                      <TableCell>{transfer.dataType}</TableCell>
                      <TableCell>{transfer.dataTransferred}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isSent && isPending && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({ open: true, transfer, action: 'accept' })}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <><Check className="mr-1 h-4 w-4" /> Accept</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({ open: true, transfer, action: 'reject' })}
                              disabled={isProcessing}
                            >
                              <X className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No transfer history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, transfer: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'accept' ? 'Accept Transfer?' : 'Reject Transfer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'accept' ? (
                <>
                  You are about to accept <strong>{confirmDialog.transfer?.dataTransferred}</strong> from{' '}
                  <strong>{confirmDialog.transfer?.fromUser}</strong>. This data will be added to your account.
                  {confirmDialog.transfer?.dataType === 'Class' && (
                    <div className="mt-2 flex items-start gap-2 text-yellow-600 dark:text-yellow-500">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">This will transfer the class along with all its students.</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  Are you sure you want to reject the transfer of <strong>{confirmDialog.transfer?.dataTransferred}</strong> from{' '}
                  <strong>{confirmDialog.transfer?.fromUser}</strong>? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.transfer) {
                  if (confirmDialog.action === 'accept') {
                    handleAcceptTransfer(confirmDialog.transfer);
                  } else {
                    handleRejectTransfer(confirmDialog.transfer);
                  }
                }
              }}
            >
              {confirmDialog.action === 'accept' ? 'Accept' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
