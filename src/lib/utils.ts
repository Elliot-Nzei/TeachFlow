
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getNextClassName = (currentName: string, allClasses: { name: string; grade: number }[]): string | null => {
  const currentClass = allClasses.find(c => c.name === currentName);
  if (!currentClass) return null;

  const nextGrade = currentClass.grade + 1;
  
  // Find a class with the exact next grade
  const nextClass = allClasses.find(c => c.grade === nextGrade);

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
