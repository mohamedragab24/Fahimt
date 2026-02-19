"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

/**
 * مكون بانر تثبيت التطبيق (PWA)
 * يظهر فقط إذا كان المتصفح يدعم التثبيت ولم يتم تثبيت التطبيق بعد.
 */
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // منع المتصفح من إظهار البانر الافتراضي فوراً
      e.preventDefault();
      // حفظ الحدث لاستخدامه عند الضغط على زر التثبيت
      setDeferredPrompt(e);
      // إظهار البانر الخاص بنا
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // التحقق مما إذا كان التطبيق يعمل بالفعل بوضع التثبيت (Standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // إظهار نافذة التثبيت الرسمية للمتصفح
    deferredPrompt.prompt();
    
    // انتظار قرار المستخدم
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] animate-in slide-in-from-top-full duration-700" dir="rtl">
      <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl border-2 border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-primary/20 overflow-hidden shadow-inner">
            {settings?.miniIconUrl ? (
              <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="App Logo" />
            ) : (
              <span className="text-primary font-black text-2xl">ف</span>
            )}
          </div>
          <div className="text-right truncate">
            <h4 className="font-black text-zinc-900 text-lg leading-tight truncate">تثبيت "{settings?.siteTitle || "فهمني"}"</h4>
            <p className="text-[10px] text-muted-foreground font-bold truncate">تطبيق خفيف وسريع على شاشتك الرئيسية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleInstallClick}
            className="h-12 px-8 rounded-2xl font-black text-md bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            تثبيت
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowBanner(false)}
            className="h-10 w-10 rounded-full text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}