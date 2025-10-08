export type User = {
  id: string;
  name: string;
  email: string;
  userCode: string;
  schoolName: string;
};

export type Student = {
  id: string;
  studentId: string;
  name: string;
  class: string;
  classId: string;
  avatarUrl: string;
};

export type Class = {
  id: string;
  name: string;
  students: string[];
  subjects: string[];
};

export type Grade = {
  id: string;
  studentName: string;
  subject: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  term: string;
  session: string;
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
  fromUser: string;
  toUser: string;
  dataType: 'Class' | 'Grades' | 'Report Card';
  dataTransferred: string;
  timestamp: string;
};

export type Settings = {
  currentTerm: 'First Term' | 'Second Term' | 'Third Term';
  currentSession: string;
  currency: '₦';
};
