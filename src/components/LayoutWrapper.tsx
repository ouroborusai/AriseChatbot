
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const hasSession = !!session;

  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/';

  if (isAuthPage || (hasSession === false && !loading)) {
    return <>{children}</>;
  }

  // Prevent sidebar flash while checking session
  if (loading && !isAuthPage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
         <div className="w-8 h-8 border-2 border-[#22c55e]/20 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
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
      <main className="lg:ml-64 min-h-screen flex flex-col pt-20 lg:pt-0 pb-32 lg:pb-0 px-4 md:px-6 max-w-full overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
