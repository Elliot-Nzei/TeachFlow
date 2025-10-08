import type { Class, Grade, DataTransfer, Student } from './types';

export const placeholderStudents: Student[] = [
    { id: 'student-1', studentId: 'SPS-001', name: 'Ada Okoro', class: 'Primary 3B', classId: 'class-1', avatarUrl: 'https://picsum.photos/seed/student-1/100/100' },
    { id: 'student-2', studentId: 'SPS-002', name: 'Bolu Adebayo', class: 'Primary 3B', classId: 'class-1', avatarUrl: 'https://picsum.photos/seed/student-2/100/100' },
    { id: 'student-3', studentId: 'SPS-003', name: 'Chidi Eze', class: 'Primary 3B', classId: 'class-1', avatarUrl: 'https://picsum.photos/seed/student-3/100/100' },
    { id: 'student-4', studentId: 'SPS-004', name: 'Dami Lola', class: 'Primary 3B', classId: 'class-1', avatarUrl: 'https://picsum.photos/seed/student-4/100/100' },
    { id: 'student-5', studentId: 'SPS-005', name: 'Emeka Nwosu', class: 'JSS 1A', classId: 'class-2', avatarUrl: 'https://picsum.photos/seed/student-5/100/100' },
    { id: 'student-6', studentId: 'SPS-006', name: 'Fatima Bello', class: 'JSS 1A', classId: 'class-2', avatarUrl: 'https://picsum.photos/seed/student-6/100/100' },
    { id: 'student-7', studentId: 'SPS-007', name: 'Gozie Anya', class: 'JSS 1A', classId: 'class-2', avatarUrl: 'https://picsum.photos/seed/student-7/100/100' },
    { id: 'student-8', studentId: 'SPS-008', name: 'Hassan Idris', class: 'JSS 1A', classId: 'class-2', avatarUrl: 'https://picsum.photos/seed/student-8/100/100' },
    { id: 'student-9', studentId: 'SPS-009', name: 'Ifeanyi Uche', class: 'Primary 6A', classId: 'class-3', avatarUrl: 'https://picsum.photos/seed/student-9/100/100' },
    { id: 'student-10', studentId: 'SPS-010', name: 'Jide Martins', class: 'Primary 6A', classId: 'class-3', avatarUrl: 'https://picsum.photos/seed/student-10/100/100' },
    { id: 'student-11', studentId: 'SPS-011', name: 'Kemi Alabi', class: 'Primary 6A', classId: 'class-3', avatarUrl: 'https://picsum.photos/seed/student-11/100/100' },
    { id: 'student-12', studentId: 'SPS-012', name: 'Lola Shodiya', class: 'Primary 6A', classId: 'class-3', avatarUrl: 'https://picsum.photos/seed/student-12/100/100' },
];

export const placeholderClasses: Class[] = [
  {
    id: 'class-1',
    name: 'Primary 3B',
    students: ['Ada Okoro', 'Bolu Adebayo', 'Chidi Eze', 'Dami Lola'],
    subjects: ['Mathematics', 'English', 'Basic Science', 'Social Studies'],
  },
  {
    id: 'class-2',
    name: 'JSS 1A',
    students: ['Emeka Nwosu', 'Fatima Bello', 'Gozie Anya', 'Hassan Idris'],
    subjects: ['Mathematics', 'English', 'Integrated Science', 'Business Studies', 'Computer Science'],
  },
    {
    id: 'class-3',
    name: 'Primary 6A',
    students: ['Ifeanyi Uche', 'Jide Martins', 'Kemi Alabi', 'Lola Shodiya'],
    subjects: ['Mathematics', 'English', 'Basic Science', 'Social Studies', 'Home Economics'],
  },
];

export const placeholderGrades: { [className: string]: Grade[] } = {
    'Primary 3B': [
        { id: 'g1', studentName: 'Ada Okoro', subject: 'Mathematics', score: 85, grade: 'A', term: 'First Term', session: '2023/2024' },
        { id: 'g2', studentName: 'Ada Okoro', subject: 'English', score: 92, grade: 'A', term: 'First Term', session: '2023/2024' },
        { id: 'g3', studentName: 'Bolu Adebayo', subject: 'Mathematics', score: 65, grade: 'B', term: 'First Term', session: '2023/2024' },
        { id: 'g4', studentName: 'Bolu Adebayo', subject: 'English', score: 71, grade: 'A', term: 'First Term', session: '2023/2024' },
    ],
    'JSS 1A': [
        { id: 'g5', studentName: 'Emeka Nwosu', subject: 'Mathematics', score: 55, grade: 'C', term: 'First Term', session: '2023/2024' },
        { id: 'g6', studentName: 'Emeka Nwosu', subject: 'Integrated Science', score: 68, grade: 'B', term: 'First Term', session: '2023/2024' },
        { id: 'g7', studentName: 'Fatima Bello', subject: 'Mathematics', score: 78, grade: 'A', term: 'First Term', session: '2023/2024' },
    ],
    'Primary 6A': [],
};

export const placeholderTransfers: DataTransfer[] = [
  { id: 't1', fromUser: 'You (NSMS-53102)', toUser: 'NSMS-11223', dataType: 'Class', dataTransferred: 'Primary 3B Data', timestamp: '2024-05-20T10:00:00Z' },
  { id: 't2', fromUser: 'NSMS-44556', toUser: 'You (NSMS-53102)', dataType: 'Grades', dataTransferred: 'JSS 1A Grades', timestamp: '2024-05-18T14:30:00Z' },
  { id: 't3', fromUser: 'You (NSMS-53102)', toUser: 'NSMS-77889', dataType: 'Report Card', dataTransferred: 'Ada Okoro Report', timestamp: '2024-05-15T09:15:00Z' },
];
