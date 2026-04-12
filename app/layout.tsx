import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AriseChatbot Dashboard',
  description: 'Panel de Automatización Industrial AriseChatbot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Arise" />
      </head>
      <body>{children}</body>
    </html>
  );
}