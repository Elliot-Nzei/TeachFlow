
'use client';
import { useState, useMemo, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { SettingsContext } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Percent, PlusCircle, Search, Trash2, Users } from 'lucide-react';
import type { Class, Student, Payment } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

type PaymentRecord = {
    studentId: string;
    studentName: string;
    studentIdentifier: string;
    classId: string;
    className: string;
    amountDue: number;
    amountPaid: number;
    balance: number;
    status: 'Paid' | 'Partially Paid' | 'Owing';
    paymentId?: string;
    lastPaymentDate?: string;
};


export default function PaymentsPage() {
    const { firestore, user } = useFirebase();
    const { settings } = useContext(SettingsContext);
    const { toast } = useToast();

    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | string>('');
    const [totalFee, setTotalFee] = useState<number | string>('');


    const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
    const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

    const studentsQuery = useMemoFirebase(() => (user && selectedClass) ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', selectedClass.id)) : null, [firestore, user, selectedClass]);
    const { data: studentsInClass, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
    
    const paymentsQuery = useMemoFirebase(() => (user && selectedClass && settings) ? query(collection(firestore, 'users', user.uid, 'payments'), where('classId', '==', selectedClass.id), where('term', '==', settings.currentTerm), where('session', '==', settings.currentSession)) : null, [firestore, user, selectedClass, settings]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    useEffect(() => {
        if (selectedClass) {
            setTotalFee(selectedClass.feeAmount || '');
        }
    }, [selectedClass]);

    const paymentRecords = useMemo<PaymentRecord[]>(() => {
        if (!studentsInClass || !settings) return [];

        const classFee = selectedClass?.feeAmount || 0;

        return studentsInClass.map(student => {
            const payment = payments?.find(p => p.studentId === student.id);
            const amountPaid = payment?.amountPaid || 0;
            const balance = classFee - amountPaid;
            let status: 'Paid' | 'Partially Paid' | 'Owing' = 'Owing';
            if (amountPaid >= classFee && classFee > 0) {
                status = 'Paid';
            } else if (amountPaid > 0) {
                status = 'Partially Paid';
            }

            return {
                studentId: student.id,
                studentName: student.name,
                studentIdentifier: student.studentId,
                classId: student.classId,
                className: student.className,
                amountDue: classFee,
                amountPaid: amountPaid,
                balance: balance,
                status: status,
                paymentId: payment?.id,
                lastPaymentDate: payment?.lastPaymentDate,
            };
        });
    }, [studentsInClass, payments, selectedClass, settings]);

    const filteredRecords = useMemo(() => {
        return paymentRecords.filter(record =>
            record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.studentIdentifier.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [paymentRecords, searchTerm]);

    const summary = useMemo(() => {
        const totalStudents = paymentRecords.length;
        const paidInFull = paymentRecords.filter(r => r.status === 'Paid').length;
        const partiallyPaid = paymentRecords.filter(r => r.status === 'Partially Paid').length;
        const owing = paymentRecords.filter(r => r.status === 'Owing').length;
        const totalCollected = paymentRecords.reduce((sum, r) => sum + r.amountPaid, 0);
        const totalDue = paymentRecords.reduce((sum, r) => sum + r.amountDue, 0);
        const outstanding = totalDue - totalCollected;

        return { totalStudents, paidInFull, partiallyPaid, owing, totalCollected, outstanding };
    }, [paymentRecords]);

    const handleEditPayment = (record: PaymentRecord) => {
        setEditingPayment(record);
        setPaymentAmount(record.amountPaid || '');
        setIsDialogOpen(true);
    };

    const handleSavePayment = async () => {
        if (!editingPayment || !user || !settings) return;

        const newAmountPaid = Number(paymentAmount);
        if (isNaN(newAmountPaid) || newAmountPaid < 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid payment amount.' });
            return;
        }

        const paymentData = {
            studentId: editingPayment.studentId,
            classId: editingPayment.classId,
            term: settings.currentTerm,
            session: settings.currentSession,
            amountDue: editingPayment.amountDue,
            amountPaid: newAmountPaid,
            balance: editingPayment.amountDue - newAmountPaid,
            status: newAmountPaid >= editingPayment.amountDue ? 'Paid' : newAmountPaid > 0 ? 'Partially Paid' : 'Owing' as 'Paid' | 'Partially Paid' | 'Owing',
            lastPaymentDate: new Date().toISOString().split('T')[0],
        };

        if (editingPayment.paymentId) {
            const paymentRef = doc(firestore, 'users', user.uid, 'payments', editingPayment.paymentId);
            updateDocumentNonBlocking(paymentRef, paymentData);
        } else {
            const paymentsCollection = collection(firestore, 'users', user.uid, 'payments');
            addDocumentNonBlocking(paymentsCollection, paymentData);
        }

        toast({ title: 'Payment Saved', description: `Payment for ${editingPayment.studentName} has been updated.` });
        setIsDialogOpen(false);
        setEditingPayment(null);
        setPaymentAmount('');
    };

    const handleSaveClassFee = async () => {
        if (!selectedClass || !user) return;
        const newFee = Number(totalFee);
        if (isNaN(newFee) || newFee < 0) {
            toast({ variant: 'destructive', title: 'Invalid Fee', description: 'Please enter a valid fee amount.' });
            return;
        }

        const classRef = doc(firestore, 'users', user.uid, 'classes', selectedClass.id);
        updateDocumentNonBlocking(classRef, { feeAmount: newFee });

        // This will trigger a re-render and re-calculation of payment records
        setSelectedClass(prev => prev ? { ...prev, feeAmount: newFee } : null);

        toast({ title: 'Class Fee Updated', description: `School fee for ${selectedClass.name} has been set to ₦${newFee.toLocaleString()}.` });
    }
    
    const getStatusBadge = (status: 'Paid' | 'Partially Paid' | 'Owing') => {
        switch (status) {
            case 'Paid': return <Badge className="bg-green-500 hover:bg-green-600">Paid in Full</Badge>;
            case 'Partially Paid': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Partially Paid</Badge>;
            case 'Owing': return <Badge variant="destructive">Owing</Badge>;
        }
    };
    
    const isLoading = isLoadingClasses || isLoadingStudents || isLoadingPayments;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-3xl font-bold font-headline">Student Payment Records</h1>
                <p className="text-muted-foreground">Track school fee payments for each term and session.</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Filters & Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="class-selector">Select Class</Label>
                            <Select onValueChange={(value) => setSelectedClass(classes?.find(c => c.id === value) || null)} value={selectedClass?.id || ''}>
                                <SelectTrigger id="class-selector">
                                    <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoadingClasses ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                    classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Current Term</Label>
                            <Input value={`${settings?.currentTerm}, ${settings?.currentSession}`} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="class-fee">Class Fee (₦)</Label>
                            <div className="flex gap-2">
                                <Input id="class-fee" type="number" placeholder="e.g., 25000" value={totalFee} onChange={e => setTotalFee(e.target.value)} disabled={!selectedClass}/>
                                <Button onClick={handleSaveClassFee} disabled={!selectedClass}>Save Fee</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedClass && (
                    <>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <Card><CardHeader className="pb-2"><CardDescription>Total Students</CardDescription><CardTitle className="text-4xl">{summary.totalStudents}</CardTitle></CardHeader></Card>
                            <Card><CardHeader className="pb-2"><CardDescription>Fully Paid</CardDescription><CardTitle className="text-4xl text-green-600">{summary.paidInFull}</CardTitle></CardHeader></Card>
                            <Card><CardHeader className="pb-2"><CardDescription>Partially Paid</CardDescription><CardTitle className="text-4xl text-yellow-600">{summary.partiallyPaid}</CardTitle></CardHeader></Card>
                            <Card><CardHeader className="pb-2"><CardDescription>Owing</CardDescription><CardTitle className="text-4xl text-red-600">{summary.owing}</CardTitle></CardHeader></Card>
                             <Card className="bg-primary text-primary-foreground"><CardHeader className="pb-2"><CardDescription className="text-primary-foreground/80">Total Collected</CardDescription><CardTitle className="text-4xl">₦{summary.totalCollected.toLocaleString()}</CardTitle></CardHeader></Card>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Payment Overview for {selectedClass.name}</CardTitle>
                                    <CardDescription>Click on a student row or card to add or update a payment.</CardDescription>
                                </div>
                                <div className="relative w-full sm:max-w-xs">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Search students..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Mobile View: Card List */}
                                <div className="md:hidden space-y-4">
                                  {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
                                  ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map(record => (
                                      <Card key={record.studentId} onClick={() => handleEditPayment(record)} className="cursor-pointer border-l-4 border-primary">
                                        <CardHeader className="pb-2">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <CardTitle className="text-base">{record.studentName}</CardTitle>
                                              <CardDescription className="font-mono text-xs">{record.studentIdentifier}</CardDescription>
                                            </div>
                                            {getStatusBadge(record.status)}
                                          </div>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Amount Paid</p>
                                                <p className="font-semibold">₦{record.amountPaid.toLocaleString()}</p>
                                            </div>
                                             <div>
                                                <p className="text-muted-foreground">Balance</p>
                                                <p className="font-semibold">₦{record.balance.toLocaleString()}</p>
                                            </div>
                                        </CardContent>
                                      </Card>
                                    ))
                                  ) : (
                                    <div className="h-24 text-center flex items-center justify-center">No students found in this class.</div>
                                  )}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden md:block border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Amount Paid (₦)</TableHead>
                                                <TableHead>Balance (₦)</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                Array.from({length: 3}).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : filteredRecords.length > 0 ? (
                                                filteredRecords.map(record => (
                                                    <TableRow key={record.studentId} onClick={() => handleEditPayment(record)} className="cursor-pointer">
                                                        <TableCell className="font-medium">{record.studentName}<br/><span className="text-xs text-muted-foreground font-mono">{record.studentIdentifier}</span></TableCell>
                                                        <TableCell>₦{record.amountPaid.toLocaleString()}</TableCell>
                                                        <TableCell>₦{record.balance.toLocaleString()}</TableCell>
                                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">No students found in this class.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment for {editingPayment?.studentName}</DialogTitle>
                        <DialogDescription>
                            Enter the total amount paid by the student for this term. The class fee is set to ₦{editingPayment?.amountDue.toLocaleString()}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Amount Paid (₦)</Label>
                            <Input id="payment-amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePayment}>Save Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

    