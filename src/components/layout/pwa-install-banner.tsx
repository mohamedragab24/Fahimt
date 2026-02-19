
"use client";

import { useState, useEffect } from "react";
import { X, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { usePathname } from "next/navigation";

/**
 * بانر تثبيت التطبيق الذكي - يظهر لمدة 7 ثوانٍ فقط إذا لم يكن التطبيق مثبتاً.
 */
export function PWAInstallBanner() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  // استبعاد صفحات الدخول والتسجيل لضمان نظافة الواجهة
  const isAuthPage = pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    setIsMounted(true);

    // التحقق مما إذا كان التطبيق يعمل بالفعل بوضعية "المثبت"
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;

    const handleBeforeInstallPrompt = (e: any) => {
      // منع المتصفح من إظهار النافذة الافتراضية
      e.preventDefault();
      // تخزين الحدث
      setDeferredPrompt(e);
      
      // إظهار البانر فقط إذا لم يكن في صفحة دخول ولم يكن التطبيق مثبتاً
      if (!isAuthPage && !isStandalone) {
        setShowBanner(true);
        
        // إخفاء البانر تلقائياً بعد 7 ثوانٍ
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 7000);
        
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isAuthPage]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // إظهار نافذة التثبيت الأصلية للجهاز
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  // حماية Hydration
  if (!isMounted || !showBanner || isAuthPage) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] animate-in slide-in-from-top-full duration-700" dir="rtl">
      <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-[2.5rem] p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-primary w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-md overflow-hidden">
            {settings?.miniIconUrl ? (
              <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="text-white font-black text-2xl">ف</span>
            )}
          </div>
          <div className="text-right truncate">
            <h4 className="font-black text-zinc-900 text-md leading-tight truncate">تثبيت تطبيق {settings?.siteTitle || "فهمني"}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-[10px] text-zinc-400 font-bold truncate">أسرع وأخف على جهازك</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleInstallClick}
            className="h-12 px-6 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            <Download size={18} className="ml-2" /> تثبيت
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowBanner(false)}
            className="h-10 w-10 rounded-full text-zinc-300"
          >
            <X size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
