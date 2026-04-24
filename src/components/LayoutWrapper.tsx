
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    }
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/';

  if (isAuthPage || hasSession === false) {
    return <>{children}</>;
  }

  // Prevent sidebar flash while checking session
  if (hasSession === null && !isAuthPage) {
    return <div className="min-h-screen bg-[#020617]" />;
  }

  return (
    <>
      {/* SIDEBAR (Visible only on LG+) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* MOBILE NAVIGATION */}
      <MobileNav />

      {/* MASTER FULL-SCREEN CONTAINER - Fluid UI / Anti-Overflow */}
      <main className="lg:ml-72 min-h-screen flex flex-col pt-20 lg:pt-0 pb-32 lg:pb-0 px-4 md:px-10 max-w-full overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
