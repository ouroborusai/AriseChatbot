
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import NeuralNotifier from "./NeuralNotifier";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const hasSession = !!session;

  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/';
  const isMessagesPage = pathname?.startsWith('/messages');

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

      {/* NEURAL NOTIFIER (Real-time sounds) */}
      <NeuralNotifier />

      {/* MASTER FULL-SCREEN CONTAINER - Fluid UI / Anti-Overflow */}
      <main className={`lg:ml-64 min-h-screen flex flex-col pt-[72px] lg:pt-0 ${isMessagesPage ? 'pb-24 lg:pb-0 px-0' : 'pb-36 lg:pb-0 px-4'} md:px-8 max-w-full overflow-x-hidden transition-all duration-500`}>
        <div className={`flex-1 w-full ${isMessagesPage ? 'max-w-full' : 'max-w-7xl'} mx-auto h-full flex flex-col`}>
          {children}
        </div>
      </main>
    </>
  );
}
