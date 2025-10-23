
'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  const uniqueId = React.useId();
  const bgGradientId = `bg-gradient-${uniqueId}`;

  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn("focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)}
    >
      <svg 
        width={compact ? 40 : 130}
        height={40}
        viewBox={compact ? "140 250 350 450" : "0 0 1024 1024"}
        role="img"
        aria-labelledby="logo-title logo-desc"
      >
        <title id="logo-title">TeachFlow Logo</title>
        <desc id="logo-desc">White TeachFlow logo with gradient background and tagline “Less Paperwork, More Passion”.</desc>

        <defs>
          <linearGradient id={bgGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b2231"/>
            <stop offset="100%" stopColor="#4ce3c6"/>
          </linearGradient>
        </defs>

        {!compact && (
          <rect width="100%" height="100%" fill={`url(#${bgGradientId})`} />
        )}
        
        <g transform="translate(300,480) scale(2.2)">
          <path d="M -80 -80 L 70 -80 L 100 -50 L 20 -50 L 20 50 L 100 50 L 70 80 L -80 80 Z"
                fill="#ffffff"/>
          <rect x="-50" y="-50" width="90" height="100" fill={`url(#${bgGradientId})`}/>
          <polygon points="0,-35 30,-17 30,17 0,35 -30,17 -30,-17" fill="#ffffff"/>
        </g>
        
        {!compact && (
          <>
            <text x="600" y="520"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontSize="120"
                  fontWeight="600"
                  textAnchor="start"
                  fill="#ffffff"
                  style={{letterSpacing:'2px'}}>
              TeachFlow
            </text>

            <text x="600" y="580"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontSize="26"
                  textAnchor="start"
                  fill="#ffffff"
                  style={{letterSpacing:'6px', textTransform:'uppercase'}}>
              LESS PAPERWORK, MORE PASSION
            </text>
          </>
        )}
      </svg>
    </Link>
  );
}
