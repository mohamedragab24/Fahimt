"use client";

import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";
import { FloatingChat } from './floating-chat';
import { PWAInstallBanner } from './pwa-install-banner';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  // تسجيل Service Worker لتحويل الموقع إلى تطبيق PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Fahimni SW registered: ', registration.scope);
          },
          (err) => {
            console.log('Fahimni SW registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return (
    <FirebaseClientProvider>
      <ThemeManager>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full overflow-hidden">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0 bg-background">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-0">
                {children}
                <Footer />
              </main>
            </div>
          </div>
          <PWAInstallBanner />
          <FloatingChat />
          <Toaster />
        </SidebarProvider>
      </ThemeManager>
    </FirebaseClientProvider>
  );
}

function ThemeManager({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // تحديث الألوان الأساسية
      if (settings.primaryColor) {
        const hsl = hexToHsl(settings.primaryColor);
        if (hsl) root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
      
      if (settings.accentColor) {
        const hsl = hexToHsl(settings.accentColor);
        if (hsl) root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }

      if (settings.backgroundColor) {
        const hsl = hexToHsl(settings.backgroundColor);
        if (hsl) root.style.setProperty('--background', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }

      // تحديث نصف قطر الزوايا (Radius)
      if (settings.borderRadius) {
        root.style.setProperty('--radius', settings.borderRadius);
      }

      // تحديث أيقونة المتصفح (Favicon)
      if (settings.faviconUrl && typeof document !== 'undefined') {
        const updateFavicon = (url: string) => {
          if (!document.head) return;
          const cacheBuster = settings.updatedAt ? encodeURIComponent(settings.updatedAt) : Date.now();
          const finalUrl = url.startsWith('data:') ? url : `${url}${url.includes('?') ? '&' : '?'}v=${cacheBuster}`;
          const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
          rels.forEach(rel => {
            const existingLinks = document.querySelectorAll(`link[rel*='${rel}']`);
            if (existingLinks.length > 0) {
              existingLinks.forEach(link => {
                (link as HTMLLinkElement).href = finalUrl;
              });
            } else {
              const link = document.createElement('link');
              link.rel = rel;
              link.href = finalUrl;
              document.head.appendChild(link);
            }
          });
        };
        updateFavicon(settings.faviconUrl);
      }

      // تحديث عنوان الموقع
      if (settings.siteTitle) {
        document.title = settings.siteTitle;
      }
    }
  }, [settings]);

  return <>{children}</>;
}

function hexToHsl(hex: string) {
  if (!hex) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else return null;

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
