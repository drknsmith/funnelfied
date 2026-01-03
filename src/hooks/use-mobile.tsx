import * as React from "react";

/**
 * Detects if the user is on a mobile device using pointer/hover capabilities.
 * This prevents narrow desktop browser windows from being treated as mobile.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initial check using pointer capabilities (works on SSR as false)
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  });

  React.useEffect(() => {
    // Use pointer/hover media query instead of width
    const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
