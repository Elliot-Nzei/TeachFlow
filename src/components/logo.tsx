
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} prefetch={false}>
      {/* Light Mode Logo */}
      <div className="dark:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="130" height="40">
          <defs>
            <linearGradient id="tfLockupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#388E3C"/>
              <stop offset="100%" stop-color="#1976D2"/>
            </linearGradient>
          </defs>
          <g stroke="url(#tfLockupGradient)" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,10)">
            <path d="M20 30 L10 60 L20 90" />
            <path d="M100 30 L110 60 L100 90" />
            <polygon points="60,35 80,47 80,73 60,85 40,73 40,47" fill="url(#tfLockupGradient)" opacity="0.85"/>
          </g>
          <text x="140" y="78" font-family="Poppins, Segoe UI, sans-serif" font-size="48" font-weight="600" fill="url(#tfLockupGradient)" letter-spacing="1">
            TeachFlow
          </text>
        </svg>
      </div>

      {/* Dark Mode Logo */}
      <div className="hidden dark:block">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="130" height="40">
           <defs>
            <linearGradient id="tfDarkLockupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#388E3C"/>
                <stop offset="100%" stop-color="#1976D2"/>
            </linearGradient>
          </defs>
          <g stroke="url(#tfDarkLockupGradient)" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,10)">
            <path d="M20 30 L10 60 L20 90" />
            <path d="M100 30 L110 60 L100 90" />
            <polygon points="60,35 80,47 80,73 60,85 40,73 40,47" fill="url(#tfDarkLockupGradient)" opacity="0.9"/>
          </g>
          <text x="140" y="78" font-family="Poppins, Segoe UI, sans-serif" font-size="48" font-weight="600" fill="url(#tfDarkLockupGradient)" letter-spacing="1">
            TeachFlow
          </text>
        </svg>
      </div>
      <span className="sr-only">TeachFlow Home</span>
    </Link>
  );
}
