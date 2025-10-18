
'use client';

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // This function will run only on the client, after the initial render.
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Run the check once on mount.
    checkScreenSize();

    // Add event listener for window resize.
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener on component unmount.
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []); // Empty dependency array ensures this runs only once on the client after hydration.

  return isMobile;
}
