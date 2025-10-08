
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Send, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp } from 'firebase/firestore';
import type { Class, DataTransfer, Grade, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type DataType = 'Class' | 'Grades' | 'Report Card';

export default function TransferPage() {
  const { firestore, user, settings: userProfile, isSettingsLoading: isLoadingProfile } = useFirebase();
  const { toast } = useToast();
  const [recipientCode, setRecipientCode] = useState('');
  const [dataType, setDataType] = useState<DataType | ''>('');
  const [dataItem, setDataItem] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Fetch all necessary data for dropdowns
  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  // Fetch transfers where the current user is either the sender or receiver
  const transfersSentQuery = useMemoFirebase(() => userProfile?.userCode ? query(collection(firestore, 'transfers'), where('fromUser', '==', userProfile.userCode)) : null, [firestore, userProfile]);
  const { data: sentTransfers, isLoading: isLoadingSent } = useCollection<DataTransfer>(transfersSentQuery);
  
  const transfersReceivedQuery = useMemoFirebase(() => userProfile?.userCode ? query(collection(firestore, 'transfers'), where('toUser', '==', userProfile.userCode)) : null, [firestore, userProfile]);
  const { data: receivedTransfers, isLoading: isLoadingReceived } = useCollection<DataTransfer>(transfersReceivedQuery);

  const allTransfers = useMemo(() => {
    const combined = [...(sentTransfers || []), ...(receivedTransfers || [])];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    // Ensure timestamp exists and is valid before sorting
    return unique.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
    });
  }, [sentTransfers, receivedTransfers]);

  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingSent || isLoadingReceived || isLoadingProfile;
  
  const dataItemOptions = useMemo(() => {
    switch (dataType) {
      case 'Class':
        return classes || [];
      case 'Grades':
      case 'Report Card':
        return students || [];
      default:
        return [];
    }
  }, [dataType, classes, students]);

  const handleTransfer = async () => {
    if (!recipientCode || !dataType || !dataItem || !userProfile?.userCode) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all fields to start a transfer.',
      });
      return;
    }
    
    if (recipientCode === userProfile.userCode) {
        toast({
            variant: 'destructive',
            title: 'Invalid Recipient',
            description: 'You cannot transfer data to yourself.',
        });
        return;
    }

    setIsTransferring(true);
    
    try {
        const transfersCollection = collection(firestore, 'transfers');
        
        let dataTransferredName = '';
        if (dataType === 'Class') {
            dataTransferredName = classes?.find(c => c.id === dataItem)?.name || 'Unknown Class';
        } else {
            dataTransferredName = students?.find(s => s.id === dataItem)?.name || 'Unknown Student';
        }

        addDocumentNonBlocking(transfersCollection, {
            fromUser: userProfile.userCode,
            toUser: recipientCode,
            dataType: dataType,
            dataId: dataItem,
            dataTransferred: dataTransferredName,
            status: 'pending', // A backend function would process this
            timestamp: serverTimestamp(),
        });

        toast({
            title: 'Transfer Initiated',
            description: `Request to transfer ${dataTransferredName} to ${recipientCode} has been sent.`,
        });

        // Reset form
        setRecipientCode('');
        setDataType('');
        setDataItem('');

    } catch (error) {
        console.error("Error initiating transfer:", error);
        toast({
            variant: 'destructive',
            title: 'Transfer Failed',
            description: 'Could not initiate the transfer. Please try again.',
        });
    } finally {
        setIsTransferring(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Data Transfer</h1>
        <p className="text-muted-foreground">Securely transfer data to another user with their unique code.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiate a New Transfer</CardTitle>
          <CardDescription>Enter the recipient's code and select the data you wish to send.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recipient-code">Recipient's User Code</Label>
              <Input id="recipient-code" placeholder="NSMS-XXXXX" value={recipientCode} onChange={e => setRecipientCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select onValueChange={(value: DataType) => { setDataType(value); setDataItem(''); }} value={dataType}>
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
              <Select onValueChange={setDataItem} value={dataItem} disabled={!dataType}>
                 <SelectTrigger id="data-item">
                    <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                    {dataItemOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTransfer} disabled={isTransferring || !recipientCode || !dataType || !dataItem}>
            {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Transfer Data
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
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : allTransfers.length > 0 ? (
                    allTransfers.map((transfer) => {
                        const isSent = transfer.fromUser === userProfile?.userCode;
                        const date = transfer.timestamp?.seconds ? new Date(transfer.timestamp.seconds * 1000) : new Date();
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
                                <TableCell className="font-mono">{isSent ? transfer.toUser : transfer.fromUser}</TableCell>
                                <TableCell>{transfer.dataType}</TableCell>
                                <TableCell>{transfer.dataTransferred}</TableCell>
                                <TableCell className="text-right">{formatDistanceToNow(date, { addSuffix: true })}</TableCell>
                            </TableRow>
                        )
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No transfer history found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
