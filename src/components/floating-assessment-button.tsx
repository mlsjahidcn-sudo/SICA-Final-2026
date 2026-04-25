"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function FloatingAssessmentButton() {
  const pathname = usePathname();
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    // Hide button on authenticated dashboard pages
    const isDashboardPage = 
      pathname.startsWith('/admin') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/partner') ||
      pathname.startsWith('/dashboard');
    
    setShowButton(!isDashboardPage);
  }, [pathname]);

  if (!showButton) {
    return null;
  }

  return (
    <Link
      href="/assessment"
      className="fixed z-40 bg-primary text-primary-foreground shadow-lg
                 hover:bg-primary/90 transition-all duration-300
                 hidden md:flex items-center gap-2
                 right-0 top-1/2 -translate-y-1/2 px-3 py-4 rounded-l-lg
                 group"
      style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      aria-label="Get Free Assessment"
    >
      <Sparkles className="h-4 w-4 rotate-180 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">Free Assessment</span>
    </Link>
  );
}
