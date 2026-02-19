"use client";

import { useState, useEffect } from "react";
import { X, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";

/**
 * بانر تثبيت التطبيق المطور - يظهر فقط بعد تسجيل الدخول وإذا لم يكن التطبيق مثبتاً.
 * يظهر فوراً ويختفي بعد 7 ثوانٍ تلقائياً.
 */
export function PWAInstallBanner() {
  const { user, isUserLoading } = useUser();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    setIsMounted(true);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // لا يظهر البانر إلا إذا كان المستخدم مسجلاً وليس في حالة تحميل
      if (!isUserLoading && user) {
        setShowBanner(true);
        // الإخفاء التلقائي بعد 7 ثوانٍ
        setTimeout(() => {
          setShowBanner(false);
        }, 7000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // التحقق من وضع الـ Standalone (إذا كان مثبت بالفعل)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;

    if (isStandalone) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [user, isUserLoading]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  // حماية إضافية: لا يعرض أي شيء إذا لم يكن هناك مستخدم مسجل
  if (!isMounted || !showBanner || !deferredPrompt || !user) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] animate-in slide-in-from-top-full duration-1000" dir="rtl">
      <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-2xl border-4 border-primary/20 shadow-[0_30px_80px_rgba(0,0,0,0.25)] rounded-[3rem] p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="bg-primary w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border-4 border-white shadow-xl overflow-hidden">
            {settings?.miniIconUrl ? (
              <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="App Logo" />
            ) : (
              <span className="text-white font-black text-3xl">ف</span>
            )}
          </div>
          <div className="text-right truncate space-y-1">
            <h4 className="font-black text-zinc-900 text-xl leading-none truncate">تثبيت تطبيق {settings?.siteTitle || "فهمني"}</h4>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-[10px] text-zinc-400 font-bold truncate">تجربة أسرع وأخف على جهازك</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleInstallClick}
            className="h-14 px-10 rounded-[1.5rem] font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
          >
            <Download size={24} /> تثبيت
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowBanner(false)}
            className="h-12 w-12 rounded-full text-zinc-300 hover:bg-zinc-100 transition-colors"
          >
            <X size={28} />
          </Button>
        </div>
      </div>
    </div>
  );
}
