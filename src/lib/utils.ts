import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getNextClassName = (currentName: string, allClasses: { name: string; level: number }[]): string | null => {
  const currentClass = allClasses.find(c => c.name === currentName);
  if (!currentClass) return null;

  const nextLevel = currentClass.level + 1;
  
  // Find a class with the exact next level
  const nextClass = allClasses.find(c => c.level === nextLevel);

  return nextClass ? nextClass.name : null;
};
