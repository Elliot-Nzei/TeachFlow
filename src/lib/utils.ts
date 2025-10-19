
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
