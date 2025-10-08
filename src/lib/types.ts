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
  score: number;
  studentName: string;
  className: string;
  grade: "A" | "B" | "C" | "D" | "F";
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
  name: string;
  schoolName: string;
  email: string;
  profilePicture: string;
  currentTerm: 'First Term' | 'Second Term' | 'Third Term';
  currentSession: string;
};
