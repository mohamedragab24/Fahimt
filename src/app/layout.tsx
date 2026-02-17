import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientWrapper } from '@/components/layout/client-wrapper';

// تصدير إعدادات نافذة العرض بشكل مستقل وفقاً لمعايير Next.js 15 الحديثة
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'فهمني - منصة التعلم الذكي',
  description: 'أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين لتبادل المعرفة.',
  keywords: 'تعلم, شرح فوري, دروس خصوصية, تعليم اونلاين, فهمني',
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
      </head>
      <body className="font-body antialiased">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
