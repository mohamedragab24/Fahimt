
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview توليد ملف manifest.json بشكل ديناميكي من الفايربيز.
 * هذا يسمح بتغيير أيقونة التطبيق واسمه من لوحة التحكم مباشرة.
 */

export async function GET() {
  let settings = {
    siteTitle: "فهمني",
    primaryColor: "#29B6F6",
    logoUrl: "https://picsum.photos/seed/fahimni/192/192",
    icon192: "https://picsum.photos/seed/fahimni/192/192",
    icon512: "https://picsum.photos/seed/fahimni/512/512"
  };

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);
    const settingsDoc = await getDoc(doc(db, "settings", "general"));
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      settings = { ...settings, ...data };
    }
  } catch (e) {
    console.error("Error fetching dynamic manifest:", e);
  }

  const manifest = {
    name: settings.siteTitle,
    short_name: settings.siteTitle,
    description: "أول منصة عربية لخدمات الشرح الفوري",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: settings.primaryColor,
    icons: [
      {
        src: settings.icon192 || settings.logoUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: settings.icon512 || settings.logoUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  return NextResponse.json(manifest);
}
