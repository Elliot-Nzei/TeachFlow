
'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  // Generate a unique ID for each instance of the logo to avoid gradient conflicts
  const uniqueId = React.useId();
  const gradientTealId = `g-teal-${uniqueId}`;
  const gradientHexId = `g-hex-${uniqueId}`;

  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn("focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)}
    >
        <svg 
            viewBox={compact ? "252 50 520 420" : "0 0 1024 750"}
            width={compact ? 40 : 130}
            height={40}
            role="img"
            aria-labelledby="logo-title logo-desc"
        >
            <title id="logo-title">TeachFlow Logo</title>
            <desc id="logo-desc">TeachFlow brand mark with adaptive color scheme for light and dark modes.</desc>
            
             <defs>
                <linearGradient id={gradientTealId} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="var(--logo-gradient-start)" />
                    <stop offset="0.45" stopColor="var(--logo-gradient-mid)" />
                    <stop offset="1" stopColor="var(--logo-gradient-end)" />
                </linearGradient>

                <linearGradient id={gradientHexId} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="var(--logo-hex-start)" />
                    <stop offset="1" stopColor="var(--logo-hex-end)" />
                </linearGradient>
            </defs>

            <g transform="translate(512,260)">
                <path d="
                M -160 -160
                L  80 -160
                L 120 -120
                L 32 -120
                L 32 120
                L 120 120
                L 80 160
                L -160 160
                Z"
                fill={`url(#${gradientTealId})`} />

                <rect x="-120" y="-120" width="160" height="240" fill="var(--logo-bg-color)" />

                <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
                        fill={`url(#${gradientHexId})`} />
            </g>

            {!compact && (
                <>
                <text x="512" y="620"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize="160"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="var(--logo-text-color)"
                    style={{letterSpacing: '2px'}}>
                    TeachFlow
                </text>
                <text x="512" y="700"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize="24"
                    textAnchor="middle"
                    fill="var(--logo-tagline-color)"
                    style={{letterSpacing: '6px', textTransform: 'uppercase'}}>
                    LESS PAPERWORK, MORE PASSION
                </text>
                </>
            )}
        </svg>
    </Link>
  );
}
