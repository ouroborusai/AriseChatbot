
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ActiveCompanyProvider } from "@/contexts/ActiveCompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LOOP | Inteligencia de Negocios en tu WhatsApp',
  description: 'Sincroniza tus documentos con el cerebro de LOOP y accede a toda tu gestión empresarial desde WhatsApp.',
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
  themeColor: "#22c55e",
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
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-white antialiased`}>
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
