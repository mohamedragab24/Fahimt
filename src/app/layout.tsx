
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientWrapper } from '@/components/layout/client-wrapper';

/**
 * إعدادات الميتا أصبحت تقرأ رابط الـ manifest الديناميكي لضمان تحديث PWA من الفايربيز.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#29B6F6',
};

export const metadata: Metadata = {
  title: 'فهمت - منصة التعلم الذكي',
  description: 'أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين لتبادل المعرفة.',
  keywords: 'تعلم, شرح فوري, دروس خصوصية, تعليم اونلاين, فهمت',
  manifest: '/manifest.json', 
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'فهمت',
  },
  openGraph: {
    title: 'فهمت - منصة التعلم الذكي',
    description: 'أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين.',
    type: 'website',
    locale: 'ar_EG',
    siteName: 'فهمت',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فهمت - منصة التعلم الذكي',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
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
