import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arise Business OS",
  description: "Next-Generation AI Personal Agent for MTZ Consultores",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Arise OS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

        {/* MASTER FULL-SCREEN CONTAINER - Fluid UI / Anti-Overflow */}
        <main className="lg:pl-72 min-h-screen flex flex-col pt-20 lg:pt-0 pb-32 lg:pb-0 px-4 md:px-10 max-w-full overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
