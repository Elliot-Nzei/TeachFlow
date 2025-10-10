

export type User = {
  id: string;
  name: string;
  email: string;
  userCode: string;
  schoolName: string;
  profilePicture: string;
};

export type Student = {
  id:string;
  studentId: string;
  name: string;
  className: string;
  classId: string;
  avatarUrl: string;
  age?: number;
  gender?: 'Male' | 'Female';
  createdAt?: any;
  promotionHistory?: { from: string; to: string; date: string; session: string; }[];
  transferredFrom?: string;
  transferredAt?: any;
};

export type Class = {
  id: string;
  name: string;
  level: number;
  students: string[];
  subjects: string[];
  createdAt?: any;
};

export type Subject = {
  id: string;
  name: string;
};

export type Grade = {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  term: string;
  session: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  total: number;
  studentName: string;
  className: string;
  grade: "A" | "B" | "C" | "D" | "E" | "F";
  remark?: string;
};

export type Attendance = {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late';
    term: string;
    session: string;
}

export type Trait = {
    id: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    term: string;
    session: string;
    traits: Record<string, number>;
}

export type LessonNote = {
    id: string;
    timestamp: string;
    formState: any; // Consider creating a specific type for this
    note: string;
}

export type ReportCard = {
  id: string;
  studentName: string;
  className: string;
  term: string;
  session: string;
  grades: { subject: string; score: number }[];
  totalScore: number;
  averageScore: number;
  overallGrade: string;
  remark: string;
};

export type DataTransfer = {
  id: string;
  fromUserCode: string;
  fromUserId: string;
  toUserCode: string;
  toUserId: string;
  dataType: 'Full Class Data' | 'Single Student Record' | 'Lesson Note';
  dataId: string;
  dataTransferred?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firestore server timestamp
  processedAt?: any; // Firestore server timestamp
  
  // Payload fields
  outgoingTransferId?: string;
  data?: any; 
  students?: Student[];
  traits?: Trait[];
  lessonNote?: LessonNote;
};

export type Settings = {
  name: string;
  schoolName: string;
  email: string;
  profilePicture: string;
  currentTerm: 'First Term' | 'Second Term' | 'Third Term';
  currentSession: string;
  userCode: string;
  studentCounter?: number;
};
