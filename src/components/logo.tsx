
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

  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn("focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)}
    >
      <svg
        width={compact ? 40 : 130}
        height={compact ? 40 : 40}
        viewBox={compact ? "150 100 350 350" : "0 0 1024 512"}
        role="img"
        aria-labelledby={`title-${uniqueId}`}
      >
        <title id={`title-${uniqueId}`}>TeachFlow Logo</title>
        <desc id={`${uniqueId}-desc`}>TeachFlow logo with properly oriented stylized C, white hexagon, and transparent background.</desc>

        {/* Stylized C mark (corrected orientation) */}
        <g transform="translate(280,260) scale(2)">
          {/* Outer C facing inward (both tips point to the center) */}
          <path d="M -80 -80 
                   L 80 -80 
                   L 40 -40 
                   L -40 -40 
                   L -40 40 
                   L 40 40 
                   L 80 80 
                   L -80 80 Z"
                fill="#ffffff"/>
          {/* Inner cutout (transparent) */}
          <rect x="-40" y="-40" width="80" height="80" fill="transparent"/>
          {/* Hexagon */}
          <polygon points="0,-35 30,-17 30,17 0,35 -30,17 -30,-17" fill="#ffffff"/>
        </g>

        {!compact && (
          <>
            {/* Wordmark */}
            <text x="580" y="270"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontSize="120"
                  fontWeight="600"
                  textAnchor="start"
                  fill="#ffffff"
                  style={{letterSpacing:'2px'}}>
              TeachFlow
            </text>

            {/* Tagline */}
            <text x="580" y="330"
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
