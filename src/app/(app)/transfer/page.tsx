
'use client';
import { useState, useMemo, useContext, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Check, X, AlertCircle, Calendar, HelpCircle, Lock, DatabaseBackup, Upload, ArrowUpRight, ArrowDownLeft, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, writeBatch, doc, orderBy, getDoc, getDocs, addDoc, updateDoc, arrayUnion, limit } from 'firebase/firestore';
import type { Class, DataTransfer, Student, Grade, LessonNote, Attendance, Trait } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsContext } from '@/contexts/settings-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePlan } from '@/contexts/plan-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

type DataType = 'Full Class Data' | 'Single Student Record' | 'Lesson Note';

type FullBackup = {
  version: string;
  exportedAt: string;
  data: {
    classes: any[];
    students: any[];
    subjects: any[];
    grades: any[];
    attendance: any[];
    traits: any[];
    payments: any[];
  };
};

const collectionsToBackup = ['classes', 'students', 'subjects', 'grades', 'attendance', 'traits', 'payments'];

const initialSelectionState = {
  classDetails: true,
  students: true,
  subjects: true,
  grades: true,
  attendance: true,
  traits: true,
};

type SelectionCategory = keyof typeof initialSelectionState;

export default function DataManagementPage() {
  const { firestore, user } = useFirebase();
  const { settings: userProfile, isLoading: isLoadingProfile, setSettings } = useContext(SettingsContext);
  const { toast } = useToast();
  const { features } = usePlan();
  const router = useRouter();
  
  // State for Data Transfer
  const [recipientCode, setRecipientCode] = useState('');
  const [dataType, setDataType] = useState<DataType | ''>('');
  const [dataItem, setDataItem] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [processingTransferId, setProcessingTransferId] = useState<string | null>(null);
  
  const [selectionDialog, setSelectionDialog] = useState<{
    open: boolean;
    transfer: DataTransfer | null;
    selections: Record<SelectionCategory, boolean>;
  }>({ open: false, transfer: null, selections: initialSelectionState });

  const [lessonNotesHistory, setLessonNotesHistory] = useState<LessonNote[]>([]);

  // State for Import/Export
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);


  useEffect(() => {
    if (!features.canUseDataTransfer) {
        router.push('/billing');
        toast({
            variant: 'destructive',
            title: 'Upgrade Required',
            description: 'You need to upgrade to the Prime plan to use this feature.'
        });
    }
  }, [features.canUseDataTransfer, router, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            const storedNotes = localStorage.getItem('lessonNotesHistory');
            if (storedNotes) {
                setLessonNotesHistory(JSON.parse(storedNotes));
            }
        } catch (e) {
            console.error("Failed to parse lesson notes from localStorage", e);
            localStorage.removeItem('lessonNotesHistory');
        }
    }
  }, []);

  const classesQuery = useMemo(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const studentsQuery = useMemoFirebase(() => (user ? query(collection(firestore, 'users', user.uid, 'students')) : null), [firestore, user]);
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
  
  const fetchStudentSubcollections = async (studentIds: string[]) => {
      if (!user || studentIds.length === 0) return {};
      
      const subcollectionNames: ('grades' | 'attendance' | 'traits')[] = ['grades', 'attendance', 'traits'];
      const results: { grades: Grade[], attendance: Attendance[], traits: Trait[] } = { grades: [], attendance: [], traits: [] };

      for (const name of subcollectionNames) {
        const q = query(collection(firestore, 'users', user.uid, name), where('studentId', 'in', studentIds));
        const snapshot = await getDocs(q);
        results[name] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any;
      }

      return results;
  }

  const handleExportData = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to export data.' });
      return;
    }
    setIsExporting(true);
    toast({ title: 'Starting Export...', description: 'Gathering all your school data. This may take a moment.' });

    try {
      const backupData: FullBackup['data'] = {
        classes: [], students: [], subjects: [], grades: [], attendance: [], traits: [], payments: []
      };

      for (const collectionName of collectionsToBackup) {
        const collRef = collection(firestore, 'users', user.uid, collectionName);
        const snapshot = await getDocs(collRef);
        backupData[collectionName as keyof FullBackup['data']] = snapshot.docs.map(doc => doc.data());
      }
      
      const fullBackup: FullBackup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: backupData
      };

      const jsonString = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `TeachFlow_backup_${userProfile?.schoolName?.replace(/\s+/g, '_') || 'school'}_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Export Successful', description: 'Your data has been downloaded.' });

    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your data.' });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToImport(event.target.files[0]);
    }
  };

  const handleImportData = async () => {
    if (!fileToImport || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a backup file to import.' });
      return;
    }
    
    setIsImporting(true);
    toast({ title: 'Starting Import...', description: 'Please do not navigate away from this page.' });

    try {
      const fileContent = await fileToImport.text();
      const backup: FullBackup = JSON.parse(fileContent);

      if (backup.version !== '1.0' || !backup.data) {
        throw new Error('Invalid or corrupted backup file format.');
      }

      const batch = writeBatch(firestore);

      for (const collectionName of collectionsToBackup) {
        const dataArray = backup.data[collectionName as keyof FullBackup['data']];
        if (dataArray && dataArray.length > 0) {
            const collRef = collection(firestore, 'users', user.uid, collectionName);
            dataArray.forEach(itemData => {
                const newDocRef = doc(collRef); // Creates a new document with a unique ID
                batch.set(newDocRef, itemData);
            });
        }
      }

      await batch.commit();
      toast({ title: 'Import Complete!', description: 'All data has been successfully restored. Please reload the page.' });

    } catch (error) {
        console.error('Import failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Import Failed', description: `Could not import data. Error: ${errorMessage}` });
    } finally {
        setIsImporting(false);
        setFileToImport(null);
    }
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

        if (dataType === 'Full Class Data') {
            const classRef = doc(firestore, `users/${user.uid}/classes/${dataItem}`);
            const classSnap = await getDoc(classRef);
            if (!classSnap.exists()) throw new Error('Selected class not found.');
            
            payload.data = classSnap.data();

            const studentsInClassQuery = query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', dataItem));
            const studentsSnap = await getDocs(studentsInClassQuery);
            const studentDocs = studentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
            payload.students = studentDocs;
            
            const studentIds = studentDocs.map(s => s.id);
            if (studentIds.length > 0) {
              const subcollectionData = await fetchStudentSubcollections(studentIds);
              payload = { ...payload, ...subcollectionData };
            }

        } else if (dataType === 'Single Student Record') {
            const studentRef = doc(firestore, `users/${user.uid}/students/${dataItem}`);
            const studentSnap = await getDoc(studentRef);
            if (!studentSnap.exists()) throw new Error('Selected student not found.');
            payload.data = { ...studentSnap.data(), id: studentSnap.id } as Student;

            const subcollectionData = await fetchStudentSubcollections([dataItem]);
            payload = { ...payload, ...subcollectionData };

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
    if (!user) return;
    setSelectionDialog({ open: true, transfer, selections: initialSelectionState });
  }

  const processSelectiveAccept = async (transfer: DataTransfer, selections: Record<SelectionCategory, boolean>) => {
    if (!user || !transfer.fromUserId || !transfer.outgoingTransferId || !userProfile) return;
    
    setProcessingTransferId(transfer.id);
    setSelectionDialog({ open: false, transfer: null, selections: {} });

    const batch = writeBatch(firestore);
    let studentCounter = userProfile.studentCounter || 0;
    
    try {
        const studentIdMap = new Map<string, string>(); 
        const recipientStudentsRef = collection(firestore, 'users', user.uid, 'students');

        const processStudent = async (student: Student) => {
            const { id: originalStudentDocId, ...studentData } = student;
            let finalStudentDocId;

            const existingStudentQuery = query(
                recipientStudentsRef, 
                where('transferredFrom', '==', transfer.fromUserId),
                where('originalStudentDocId', '==', originalStudentDocId),
                limit(1)
            );
            const existingStudentSnap = await getDocs(existingStudentQuery);

            if (!existingStudentSnap.empty) {
                finalStudentDocId = existingStudentSnap.docs[0].id;
            } else {
                studentCounter++;
                const schoolAcronym = userProfile.userCode ? userProfile.userCode.split('-')[0] : 'SPS';
                const newStudentId = `${schoolAcronym}-${String(studentCounter).padStart(3, '0')}`;
                
                const newStudentRef = doc(recipientStudentsRef);
                batch.set(newStudentRef, {
                  ...studentData,
                  studentId: newStudentId,
                  transferredFrom: transfer.fromUserId,
                  originalStudentDocId: originalStudentDocId,
                  transferredAt: serverTimestamp(),
                });
                finalStudentDocId = newStudentRef.id;
            }
            studentIdMap.set(originalStudentDocId, finalStudentDocId);
        }

        if (selections.students) {
            const studentsToProcess: Student[] = [];
            if (transfer.dataType === 'Full Class Data' && transfer.students) {
                studentsToProcess.push(...transfer.students);
            } else if (transfer.dataType === 'Single Student Record' && transfer.data) {
                studentsToProcess.push(transfer.data as Student);
            }

            for (const student of studentsToProcess) {
                await processStudent(student);
            }
        }
        
        if (transfer.dataType === 'Full Class Data' && selections.classDetails) {
            if (!transfer.data || !transfer.data.name) throw new Error('Invalid class data in transfer.');
            
            const classesRef = collection(firestore, 'users', user.uid, 'classes');
            const q = query(classesRef, where('name', '==', transfer.data.name), limit(1));
            const classQuerySnap = await getDocs(q);

            let classRef;
            const studentDocIdsToMerge = Array.from(studentIdMap.values());

            if (classQuerySnap.empty) {
                classRef = doc(classesRef);
                batch.set(classRef, { ...transfer.data, students: studentDocIdsToMerge, transferredFrom: transfer.fromUserId, transferredAt: serverTimestamp() });
            } else {
                classRef = classQuerySnap.docs[0].ref;
                batch.update(classRef, { 
                    subjects: selections.subjects ? arrayUnion(...(transfer.data.subjects || [])) : undefined,
                    students: selections.students ? arrayUnion(...studentDocIdsToMerge) : undefined,
                    transferredFrom: transfer.fromUserId, 
                    transferredAt: serverTimestamp() 
                });
            }

            for (const studentId of studentDocIdsToMerge) {
                const studentRefToUpdate = doc(firestore, 'users', user.uid, 'students', studentId);
                batch.update(studentRefToUpdate, { classId: classRef.id, className: transfer.data.name });
            }
        }
        
        if (selections.subjects && transfer.dataType === 'Full Class Data' && transfer.data.subjects && transfer.data.subjects.length > 0) {
            const subjectsRef = collection(firestore, 'users', user.uid, 'subjects');
            const existingSubjectsSnap = await getDocs(subjectsRef);
            const existingSubjectNames = existingSubjectsSnap.docs.map(d => d.data().name.toLowerCase());
            
            for (const subjectName of transfer.data.subjects) {
              if (!existingSubjectNames.includes(subjectName.toLowerCase())) {
                batch.set(doc(subjectsRef), { name: subjectName });
              }
            }
        }
        
        const upsertSubcollectionData = async (
          subcollectionName: 'grades' | 'attendance' | 'traits',
          dataArray: any[] | undefined
        ) => {
            if (!dataArray || !user) return;
            const subcollectionRef = collection(firestore, 'users', user.uid, subcollectionName);

            for (const item of dataArray) {
                const { id: originalDocId, studentId: originalStudentId, ...itemData } = item;
                const newStudentDocId = studentIdMap.get(originalStudentId);
                if (!newStudentDocId) continue; // Skip if student wasn't imported

                let uniquenessQuery;
                if (subcollectionName === 'grades') {
                    uniquenessQuery = query(subcollectionRef, where('studentId', '==', newStudentDocId), where('subject', '==', item.subject), where('term', '==', item.term), where('session', '==', item.session));
                } else if (subcollectionName === 'attendance') {
                    uniquenessQuery = query(subcollectionRef, where('studentId', '==', newStudentDocId), where('date', '==', item.date));
                } else { // traits
                    uniquenessQuery = query(subcollectionRef, where('studentId', '==', newStudentDocId), where('term', '==', item.term), where('session', '==', item.session));
                }

                if (!uniquenessQuery) continue;

                const existingSnap = await getDocs(uniquenessQuery);
                const dataToSave = { ...itemData, studentId: newStudentDocId, transferredFrom: transfer.fromUserId };

                if (existingSnap.empty) {
                    batch.set(doc(subcollectionRef), dataToSave);
                } else {
                    const existingDocRef = existingSnap.docs[0].ref;
                    batch.update(existingDocRef, dataToSave);
                }
            }
        };

        if (selections.grades) await upsertSubcollectionData('grades', transfer.grades);
        if (selections.attendance) await upsertSubcollectionData('attendance', transfer.attendance);
        if (selections.traits) await upsertSubcollectionData('traits', transfer.traits);
        
        const timestamp = serverTimestamp();
        const incomingRef = doc(firestore, 'users', user.uid, 'incomingTransfers', transfer.id);
        batch.update(incomingRef, { status: 'accepted', processedAt: timestamp });
        
        const outgoingRef = doc(firestore, 'users', transfer.fromUserId, 'outgoingTransfers', transfer.outgoingTransferId);
        batch.update(outgoingRef, { status: 'accepted', processedAt: timestamp });
        
        if (studentCounter > (userProfile.studentCounter || 0)) {
          const userRef = doc(firestore, 'users', user.uid);
          batch.update(userRef, { studentCounter: studentCounter });
        }

        await batch.commit();
        
        if (studentCounter > (userProfile.studentCounter || 0)) {
          setSettings({ studentCounter: studentCounter });
        }

        toast({
            title: 'Transfer Accepted',
            description: `Data for "${transfer.dataTransferred}" has been selectively merged into your account.`,
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
  }


  const handleRejectTransfer = async (transfer: DataTransfer) => {
    if (!user || !transfer.fromUserId || !transfer.outgoingTransferId) return;
    setProcessingTransferId(transfer.id);

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
  
  const copyCode = async (textToCopy: string) => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            toast({
                title: 'Copied to Clipboard',
                description: 'Your user code is copied to clipboard.',
            });
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.width = "2em";
            textArea.style.height = "2em";
            textArea.style.padding = "0";
            textArea.style.border = "none";
            textArea.style.outline = "none";
            textArea.style.boxShadow = "none";
            textArea.style.background = "transparent";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                 toast({
                    title: 'Copied to Clipboard',
                    description: 'Your user code is copied to clipboard.',
                });
            } catch (copyErr) {
                 toast({
                    variant: 'destructive',
                    title: 'Copy Failed',
                    description: 'Could not copy the code to your clipboard.',
                });
            }
            document.body.removeChild(textArea);
        }
  }

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
                    <Button size="sm" variant="outline" onClick={() => handleAcceptTransfer(transfer)} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectTransfer(transfer)} disabled={isProcessing}>
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
            </CardContent>
        </Card>
    );
  }

  const selectionOptions: { id: SelectionCategory, label: string, description: string, dependsOn?: SelectionCategory }[] = [
      { id: 'classDetails', label: 'Class Details', description: 'The main class information (name, grade, etc.).' },
      { id: 'students', label: 'Student Roster', description: `The list of ${selectionDialog.transfer?.students?.length || 0} students.`, dependsOn: 'classDetails' },
      { id: 'subjects', label: 'Subject Assignments', description: 'The subjects assigned to this class.', dependsOn: 'classDetails' },
      { id: 'grades', label: 'Grade Records', description: `${selectionDialog.transfer?.grades?.length || 0} grade entries for these students.`, dependsOn: 'students' },
      { id: 'attendance', label: 'Attendance Records', description: `${selectionDialog.transfer?.attendance?.length || 0} attendance entries.`, dependsOn: 'students' },
      { id: 'traits', label: 'Behavioral Traits', description: `${selectionDialog.transfer?.traits?.length || 0} trait assessments.`, dependsOn: 'students' },
  ];

  const handleSelectionChange = (category: SelectionCategory, checked: boolean) => {
    setSelectionDialog(prev => {
        const newSelections = { ...prev.selections, [category]: checked };
        // If a parent is unchecked, uncheck its children
        if (!checked) {
            selectionOptions.forEach(opt => {
                if (opt.dependsOn === category) {
                    newSelections[opt.id] = false;
                }
            });
        }
        // If a child is checked, ensure its parent is also checked
        if (checked) {
            const parent = selectionOptions.find(opt => opt.id === category)?.dependsOn;
            if (parent) {
                newSelections[parent] = true;
            }
        }
        return { ...prev, selections: newSelections };
    });
  };

  if (!features.canUseDataTransfer) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2"><Lock className="h-5 w-5" /> Access Denied</CardTitle>
                    <CardDescription>This feature is available on the Prime plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Upgrade to the Prime plan to securely manage and transfer your school data.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/billing')} className="w-full">View Plans</Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Data Management</h1>
        <p className="text-muted-foreground">Export, import, and transfer your school data.</p>
      </div>

      <div className="space-y-8">
          {userProfile?.userCode && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className='flex-1'>
                      <span className="text-sm text-muted-foreground mr-2">Your Unique Transfer Code:</span>
                      <span className="font-mono font-bold text-primary text-lg">{userProfile.userCode}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(userProfile.userCode)}>
                      Copy Code
                  </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <Tabs defaultValue="transfer">
                <CardHeader>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transfer">New Transfer</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <TabsContent value="transfer">
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
                </TabsContent>
                <TabsContent value="history">
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
                </TabsContent>
            </Tabs>
        </Card>

          <Card>
            <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
                <CardDescription>Create a full backup of your data or restore from a previous one.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                        <DatabaseBackup className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Export All Data</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Download a full backup of all your school data into a single JSON file.</p>
                    <Button onClick={handleExportData} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Exporting...' : 'Export Data'}
                    </Button>
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                     <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Import Data</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Restore data from a previously exported backup file. This will add to existing data.</p>
                     <div className="space-y-2">
                      <Label htmlFor="import-file" className="sr-only">Backup File (.json)</Label>
                      <Input id="import-file" type="file" accept=".json" onChange={handleFileChange} disabled={isImporting} />
                  </div>
                    <Button onClick={handleImportData} disabled={!fileToImport || isImporting} size="sm">
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isImporting ? 'Importing...' : 'Import Data'}
                    </Button>
                </div>
            </CardContent>
             <CardFooter>
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Importing data will add to your existing records, not replace them. Use with caution to avoid duplicates.
                    </AlertDescription>
                  </Alert>
            </CardFooter>
          </Card>
      </div>

       <Dialog open={selectionDialog.open} onOpenChange={(open) => !open && setSelectionDialog({ open: false, transfer: null, selections: {} })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Data to Import</DialogTitle>
            <DialogDescription>
              Choose which parts of the transfer "<strong>{selectionDialog.transfer?.dataTransferred}</strong>" you want to import.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
              {selectionOptions.map(option => (
                  <div key={option.id} className="flex items-start space-x-3 rounded-md p-3 hover:bg-muted/50">
                      <Checkbox
                          id={option.id}
                          checked={selectionDialog.selections[option.id]}
                          onCheckedChange={(checked) => handleSelectionChange(option.id, !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                          <label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {option.label}
                          </label>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                  </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectionDialog(prev => ({...prev, open: false}))}>Cancel</Button>
            <Button onClick={() => selectionDialog.transfer && processSelectiveAccept(selectionDialog.transfer, selectionDialog.selections)}>
                <Check className="mr-2 h-4 w-4" /> Accept & Import Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
