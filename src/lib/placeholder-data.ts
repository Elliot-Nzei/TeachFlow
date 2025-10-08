import type { Class, Grade, DataTransfer } from './types';

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
