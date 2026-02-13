"use client";

import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
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
              </main>
            </div>
          </div>
          <Toaster />
        </SidebarProvider>
      </ThemeManager>
    </FirebaseClientProvider>
  );
}

/**
 * مكون لإدارة الثيم الديناميكي وحقن الألوان من قاعدة البيانات.
 */
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
    }
  }, [settings]);

  return <>{children}</>;
}

// دالة مساعدة لتحويل Hex إلى HSL لتتوافق مع Tailwind CSS Variables
function hexToHsl(hex: string) {
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
