import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
        {/* SIDEBAR (Hidden on small screens, fixed on lg) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* MASTER CONTENT CONTAINER */}
        <div className="lg:pl-72 min-h-screen">
          <div className="max-w-[1600px] mx-auto p-4 md:p-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
