

export type User = {
  id: string;
  name: string;
  email: string;
  userCode: string;
  schoolName: string;
  profilePicture: string;
};

export type Student = {
  id: string;
  studentId: string;
  name: string;
  className: string;
  classId: string;
  avatarUrl: string;
  age?: number;
  gender?: 'Male' | 'Female';
};

export type Class = {
  id: string;
  name: string;
  students: string[];
  subjects: string[];
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
  grade: "A" | "B" | "C" | "D" | "F";
  remark?: string;
};

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
  dataType: 'Class' | 'Grades' | 'Report Card';
  dataId: string;
  dataTransferred?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firestore server timestamp
  processedAt?: any; // Firestore server timestamp
  outgoingTransferId?: string;
  data?: any; // Contains the class or student data
  students?: any[]; // For class transfers, include student list
  grades?: any[]; // For grade transfers
};

export type Settings = {
  name: string;
  schoolName: string;
  email: string;
  profilePicture: string;
  currentTerm: 'First Term' | 'Second Term' | 'Third Term';
  currentSession: string;
};

    

    

