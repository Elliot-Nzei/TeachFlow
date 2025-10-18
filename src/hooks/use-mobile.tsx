
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Initial check in case window size changed since initial render
    checkScreenSize()

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return isMobile
}
