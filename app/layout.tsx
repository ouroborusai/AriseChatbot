import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QuickShip Admin',
  description: 'Panel de control para agente de WhatsApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}