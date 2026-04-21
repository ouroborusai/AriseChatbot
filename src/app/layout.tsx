
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ActiveCompanyProvider } from "@/contexts/ActiveCompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OUROBOT | Tu Empresa en un Mensaje",
  description: "Automatización Neural Inteligente para tu Negocio vía WhatsApp",
  manifest: "/manifest.json",
  icons: {
    icon: '/ourobot-logo.png',
    apple: '/ourobot-logo.png',
  },
  appleWebApp: {
    capable: true,
    title: "OUROBOT OS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
      <body className={`${inter.className} min-h-screen bg-[#000000] antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <ActiveCompanyProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ActiveCompanyProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
