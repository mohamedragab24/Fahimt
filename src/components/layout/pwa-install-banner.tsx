
"use client";

import { useState, useEffect } from "react";
import { X, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

/**
 * بانر تثبيت التطبيق المطور - يظهر فوراً ويختفي بعد 7 ثوانٍ.
 * يستدعي نافذة التثبيت الرسمية للجهاز (Native Install Dialog).
 */
export function PWAInstallBanner() {
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
    
    // الاستماع لحدث التثبيت الرسمي من المتصفح
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // بمجرد توفر الحدث، نظهر البانر
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // إظهار البانر فوراً (مع ميزة الإخفاء التلقائي)
    const isDismissed = sessionStorage.getItem("pwa_banner_dismissed");
    if (!isDismissed) {
      // إظهار مبدئي لضمان رؤية المستخدم له
      setShowBanner(true);
      
      // الإخفاء التلقائي بعد 7 ثوانٍ
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 7000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // إذا لم يكن الحدث جاهزاً، نوجه المستخدم للطريقة اليدوية
      alert("لتثبيت التطبيق: اضغط على خيارات المتصفح (⋮) ثم اختر 'Add to Home Screen' أو 'تثبيت التطبيق'.");
      return;
    }
    
    // إظهار نافذة التثبيت الأصلية للجهاز
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (!isMounted || !showBanner) return null;

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
              <p className="text-[10px] text-zinc-400 font-bold truncate">أسرع، أخف، وتواصل مباشر</p>
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
            onClick={handleDismiss}
            className="h-12 w-12 rounded-full text-zinc-300 hover:bg-zinc-100 transition-colors"
          >
            <X size={28} />
          </Button>
        </div>
      </div>
    </div>
  );
}
