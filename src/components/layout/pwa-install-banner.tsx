
"use client";

import { useState, useEffect } from "react";
import { X, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { usePathname } from "next/navigation";

/**
 * بانر تثبيت التطبيق المطور - يظهر فقط بعد تسجيل الدخول وفي الصفحات الداخلية.
 * يظهر فوراً ويختفي بعد 7 ثوانٍ تلقائياً.
 */
export function PWAInstallBanner() {
  const { user, isUserLoading } = useUser();
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

  // استبعاد صفحة الهبوط وصفحات الدخول/التسجيل
  const isExcludedPath = pathname === "/" || pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    setIsMounted(true);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // إظهار البانر فقط للمسجلين وفي غير الصفحات المستبعدة
    if (!isUserLoading && user && !isExcludedPath && deferredPrompt) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone;

      if (!isStandalone) {
        setShowBanner(true);
        // الإخفاء التلقائي بعد 7 ثوانٍ
        const timer = setTimeout(() => {
          setShowBanner(false);
        }, 7000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowBanner(false);
    }
  }, [user, isUserLoading, pathname, isExcludedPath, deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  if (!isMounted || !showBanner || !user || isExcludedPath) return null;

  return (
    <div className="fixed top-2 left-2 right-2 z-[200] animate-in slide-in-from-top-full duration-700" dir="rtl">
      <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-[2rem] p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-md overflow-hidden">
            {settings?.miniIconUrl ? (
              <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="text-white font-black text-xl">ف</span>
            )}
          </div>
          <div className="text-right truncate">
            <h4 className="font-black text-zinc-900 text-sm leading-tight truncate">تثبيت تطبيق {settings?.siteTitle || "فهمني"}</h4>
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} size={8} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-[8px] text-zinc-400 font-bold truncate">أسرع وأخف على جهازك</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleInstallClick}
            size="sm"
            className="h-10 px-5 rounded-xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            <Download size={16} className="ml-1.5" /> تثبيت
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowBanner(false)}
            className="h-8 w-8 rounded-full text-zinc-300"
          >
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
