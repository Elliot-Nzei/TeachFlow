
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
  animated?: boolean;
}

export function Logo({ className, compact = false, animated = true }: LogoProps) {
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn(
        "inline-flex items-center gap-2 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-sm transition-opacity hover:opacity-90",
        className
      )}
    >
      {/* Light Mode Logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 120"
        width={compact ? 80 : 130}
        height={compact ? 30 : 40}
        className={cn(
          "dark:hidden",
          animated && "transition-transform duration-300 ease-out hover:scale-[1.03]"
        )}
        aria-hidden="true"
        role="img"
      >
        <defs>
          <linearGradient id="tfGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <g transform="translate(0,10)">
          <g
            stroke="url(#tfGradientLight)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          >
            <path d="M20 30 L10 60 L20 90" className={animated ? "animate-pulse-slow" : ""} />
            <path d="M100 30 L110 60 L100 90" className={animated ? "animate-pulse-slow" : ""} />
          </g>
          <g>
             <polygon
              points="60,35 80,47 80,73 60,85 40,73 40,47"
              fill="url(#tfGradientLight)"
              opacity="0.2"
              stroke="url(#tfGradientLight)"
              strokeWidth="2"
            />
            <polygon
              points="60,40 75,50 75,70 60,80 45,70 45,50"
              fill="url(#tfGradientLight)"
              opacity="0.9"
            />
          </g>
        </g>
        {!compact && (
          <text
            x="140"
            y="78"
            fontFamily="'Inter', 'Poppins', 'Segoe UI', system-ui, sans-serif"
            fontSize="48"
            fontWeight="700"
            fill="hsl(var(--primary))"
            letterSpacing="0.5"
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
        className={cn(
          "hidden dark:block",
          animated && "transition-transform duration-300 ease-out hover:scale-[1.03]"
        )}
        aria-hidden="true"
        role="img"
      >
        <defs>
          <linearGradient id="tfGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <g transform="translate(0,10)">
          <g
            stroke="url(#tfGradientDark)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          >
            <path d="M20 30 L10 60 L20 90" className={animated ? "animate-pulse-slow" : ""} />
            <path d="M100 30 L110 60 L100 90" className={animated ? "animate-pulse-slow" : ""} />
          </g>
          <g>
            <polygon
              points="60,35 80,47 80,73 60,85 40,73 40,47"
              fill="url(#tfGradientDark)"
              opacity="0.25"
              stroke="url(#tfGradientDark)"
              strokeWidth="2"
            />
            <polygon
              points="60,40 75,50 75,70 60,80 45,70 45,50"
              fill="url(#tfGradientDark)"
              opacity="0.95"
            />
          </g>
        </g>
        {!compact && (
          <text
            x="140"
            y="78"
            fontFamily="'Inter', 'Poppins', 'Segoe UI', system-ui, sans-serif"
            fontSize="48"
            fontWeight="700"
            fill="hsl(var(--primary))"
            letterSpacing="0.5"
          >
            TeachFlow
          </text>
        )}
      </svg>
    </Link>
  );
}
