import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ouroborus AI | Business OS",
  description: "Advanced Neural Brain Dashboard v6.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-base`}>
        <Sidebar />
        <div className="ml-64">
          {children}
        </div>
      </body>
    </html>
  );
}
