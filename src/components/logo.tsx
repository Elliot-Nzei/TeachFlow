import Link from 'next/link';
import { School } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <School className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold text-primary font-headline">TeachFlow</span>
    </Link>
  );
}
