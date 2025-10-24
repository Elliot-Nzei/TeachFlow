'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

interface LogoProps {
  className?: string;
  compact?: boolean;
  href?: string;
  animated?: boolean;
}

export function Logo({ className, compact = false, href = "/", animated = false }: LogoProps) {
  const uniqueId = React.useId();

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn(
        "group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-opacity hover:opacity-90",
        className
      )}
    >
      <svg
        width={compact ? 40 : 130}
        height={40}
        viewBox={compact ? "150 100 350 350" : "0 0 1024 512"}
        role="img"
        aria-labelledby={`logo-title-${uniqueId}`}
        className={cn(animated && "transition-transform group-hover:scale-105")}
      >
        <title id={`logo-title-${uniqueId}`}>TeachFlow Logo</title>
        <desc id={`logo-desc-${uniqueId}`}>
          TeachFlow - An educational platform logo featuring a hexagonal icon with adaptive colors.
        </desc>
        
        <defs>
          {/* Gradient definitions for enhanced visual appeal */}
          <linearGradient id={`logo-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--logo-gradient-start, #3b82f6)" />
            <stop offset="100%" stopColor="var(--logo-gradient-end, #2563eb)" />
          </linearGradient>
          
          <linearGradient id={`hex-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--logo-hex-start, #3b82f6)" />
            <stop offset="100%" stopColor="var(--logo-hex-end, #1d4ed8)" />
          </linearGradient>

          {/* Optional shadow filter for depth */}
          <filter id={`logo-shadow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <style>
          {`
            .tf-logo-mark { 
              fill: url(#logo-gradient-${uniqueId}); 
              transition: all 0.3s ease;
            }
            .tf-logo-text { 
              fill: var(--logo-text-color, currentColor);
              transition: fill 0.3s ease;
            }
            .tf-logo-tagline { 
              fill: var(--logo-tagline-color, #6b7280);
              transition: fill 0.3s ease;
            }
            .tf-logo-hex { 
              fill: url(#hex-gradient-${uniqueId});
              transition: all 0.3s ease;
            }
            .tf-logo-bg { 
              fill: var(--logo-bg-color, #ffffff);
              transition: fill 0.3s ease;
            }
            ${animated ? `
              @keyframes pulse-subtle {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.85; }
              }
              .group:hover .tf-logo-hex {
                animation: pulse-subtle 2s ease-in-out infinite;
              }
            ` : ''}
          `}
        </style>

        {/* Main logo mark with improved structure */}
        <g transform="translate(280,260) scale(2)" filter={`url(#logo-shadow-${uniqueId})`}>
          {/* Outer frame */}
          <path 
            d="M -80 -80 L 80 -80 L 40 -40 L -40 -40 L -40 40 L 40 40 L 80 80 L -80 80 Z" 
            className="tf-logo-mark"
            aria-hidden="true"
          />
          
          {/* Center background */}
          <rect 
            x="-40" 
            y="-40" 
            width="80" 
            height="80" 
            className="tf-logo-bg"
            aria-hidden="true"
          />
          
          {/* Hexagon icon */}
          <polygon 
            points="0,-35 30,-17 30,17 0,35 -30,17 -30,-17" 
            className="tf-logo-hex"
            aria-hidden="true"
          />
        </g>

        {/* Text elements (full logo only) */}
        {!compact && (
          <g aria-label="TeachFlow - Less paperwork, more passion">
            {/* Main text */}
            <text 
              x="580" 
              y="270" 
              fontFamily="var(--font-headline, Georgia, 'Times New Roman', serif)" 
              fontSize="120" 
              fontWeight="600" 
              textAnchor="start" 
              className="tf-logo-text"
              style={{ letterSpacing: '2px' }}
              aria-hidden="true"
            >
              TeachFlow
            </text>
            
            {/* Tagline */}
            <text 
              x="580" 
              y="330" 
              fontFamily="var(--font-sans, system-ui, -apple-system, sans-serif)" 
              fontSize="26" 
              fontWeight="500"
              textAnchor="start" 
              className="tf-logo-tagline"
              style={{ 
                letterSpacing: '6px', 
                textTransform: 'uppercase',
                opacity: 0.8
              }}
              aria-hidden="true"
            >
              Less Paperwork, More Passion
            </text>
          </g>
        )}
      </svg>
    </Link>
  );
}

// Export a simple icon version for use in tight spaces
export function LogoIcon({ className, animated = false }: Omit<LogoProps, 'compact'>) {
  return <Logo className={className} compact animated={animated} />;
}

// Export a minimal text-only version
export function LogoText({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="TeachFlow Home"
      className={cn(
        "inline-flex items-center font-headline text-2xl font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors hover:text-primary",
        className
      )}
    >
      TeachFlow
    </Link>
  );
}