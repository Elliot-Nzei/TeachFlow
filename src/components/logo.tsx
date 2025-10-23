import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn("flex items-center gap-2 select-none", className)}
    >
      {/* Light Mode Logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 120"
        width={compact ? 80 : 130}
        height={compact ? 30 : 40}
        className="dark:hidden transition-transform duration-200 hover:scale-[1.02]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tfGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F8FFF" />
            <stop offset="100%" stopColor="#00E6B8" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#tfGradientLight)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0,10)"
        >
          <path d="M20 30 L10 60 L20 90" />
          <path d="M100 30 L110 60 L100 90" />
          <polygon
            points="60,35 80,47 80,73 60,85 40,73 40,47"
            fill="url(#tfGradientLight)"
            opacity="0.85"
          />
        </g>
        {!compact && (
          <text
            x="140"
            y="78"
            fontFamily="Poppins, Segoe UI, sans-serif"
            fontSize="48"
            fontWeight="600"
            fill="url(#tfGradientLight)"
            letterSpacing="1"
          >
            TeachFlow
          </text>
        )}
      </svg>

      {/* Dark Mode Logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 120"
        width={compact ? 80 : 130}
        height={compact ? 30 : 40}
        className="hidden dark:block transition-transform duration-200 hover:scale-[1.02]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tfGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E6B8" />
            <stop offset="100%" stopColor="#0F8FFF" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#tfGradientDark)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0,10)"
        >
          <path d="M20 30 L10 60 L20 90" />
          <path d="M100 30 L110 60 L100 90" />
          <polygon
            points="60,35 80,47 80,73 60,85 40,73 40,47"
            fill="url(#tfGradientDark)"
            opacity="0.9"
          />
        </g>
        {!compact && (
          <text
            x="140"
            y="78"
            fontFamily="Poppins, Segoe UI, sans-serif"
            fontSize="48"
            fontWeight="600"
            fill="url(#tfGradientDark)"
            letterSpacing="1"
          >
            TeachFlow
          </text>
        )}
      </svg>
    </Link>
  );
}
