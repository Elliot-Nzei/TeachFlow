
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getNextClassName = (currentName: string, allClasses: { name: string; grade: string }[]): string | null => {
  const currentClass = allClasses.find(c => c.name === currentName);
  if (!currentClass) return null;

  const currentGradeNum = parseInt(currentClass.grade, 10);
  
  // If the current grade is not a number (e.g., "Pre-Nursery"), we can't promote numerically.
  if (isNaN(currentGradeNum)) {
    return null;
  }

  const nextGrade = currentGradeNum + 1;
  
  // Find a class with the exact next numeric grade
  const nextClass = allClasses.find(c => parseInt(c.grade, 10) === nextGrade);

  return nextClass ? nextClass.name : null;
};

/**
 * Converts a string to title case where the first letter of each word is capitalized, preserving spaces.
 * @param str The input string.
 * @returns The title-cased string.
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase());
}

/**
 * Calculates a grade based on a score, following a standard Nigerian grading system.
 * @param score The score out of 100.
 * @returns A letter grade ('A', 'B', 'C', 'D', 'E', or 'F').
 */
export const calculateNigerianGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' => {
  if (score >= 75) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  if (score >= 45) return 'E';
  return 'F';
};
