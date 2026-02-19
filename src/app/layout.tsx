import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientWrapper } from '@/components/layout/client-wrapper';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#29B6F6',
};

export const metadata: Metadata = {
  title: 'فهمني - منصة التعلم الذكي',
  description: 'أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين لتبادل المعرفة.',
  keywords: 'تعلم, شرح فوري, دروس خصوصية, تعليم اونلاين, فهمني',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'فهمني',
  },
  openGraph: {
    title: 'فهمني - منصة التعلم الذكي',
    description: 'أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين.',
    type: 'website',
    locale: 'ar_EG',
    siteName: 'فهمني',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فهمني - منصة التعلم الذكي',
    description: 'أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/fahimni/192/192" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-body antialiased">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
