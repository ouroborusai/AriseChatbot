import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arise Chatbot | Intelligence Platform",
  description: "Next-Generation AI Personal Agent for MTZ Consultores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#f7f9fb] antialiased`}>
        {/* SIDEBAR (Visible only on LG+) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* MOBILE NAVIGATION */}
        <MobileNav />

        {/* MASTER FULL-SCREEN CONTAINER */}
        <div className="lg:pl-72 min-h-screen flex flex-col pt-20 lg:pt-0 pb-32 lg:pb-0">
          {children}
        </div>
      </body>
    </html>
  );
}
