
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * مكون النافذة الترحيبية (Welcome Modal / Popup Overlay)
 * يظهر للمستخدم عند فتح الموقع لأول مرة في الجلسة.
 */
export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    // التحقق مما إذا كانت الصورة موجودة في الإعدادات
    if (settings?.splashImageUrl) {
      // التحقق مما إذا كانت قد ظهرت بالفعل في هذه الجلسة
      const hasShown = sessionStorage.getItem("welcome_modal_shown");
      if (!hasShown) {
        // تأخير بسيط لضمان جمالية الظهور بعد تحميل الصفحة
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [settings?.splashImageUrl]);

  const handleClose = () => {
    setIsOpen(false);
    // حفظ حالة الظهور في sessionStorage لضمان عدم تكرارها إلا عند فتح المتصفح من جديد
    sessionStorage.setItem("welcome_modal_shown", "true");
  };

  if (!settings?.splashImageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-[95vw] md:max-w-4xl p-0 border-none bg-transparent shadow-none overflow-visible flex items-center justify-center" 
        dir="rtl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>مرحباً بك في فهمني</DialogTitle>
          <DialogDescription>نافذة ترحيبية تظهر لمستخدمي المنصة الجدد.</DialogDescription>
        </DialogHeader>
        
        <div className="relative group animate-in zoom-in fade-in duration-500 ease-out">
          {/* زر الإغلاق المخصص فوق الصورة */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute -top-12 md:-top-6 -right-2 md:-right-12 z-[110] bg-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12 border border-white/20 backdrop-blur-md transition-all shadow-2xl"
          >
            <X size={28} />
          </Button>

          {/* حاوية الصورة مع ظلال سينمائية */}
          <div className="rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.6)] border-8 border-white/5 bg-zinc-900/50 backdrop-blur-sm">
            <img
              src={settings.splashImageUrl}
              alt="Fahimni Welcome"
              className="w-full h-auto max-h-[80vh] object-contain select-none pointer-events-none"
            />
          </div>

          {/* شارة توضيحية اختيارية بالأسفل */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary px-8 py-3 rounded-2xl shadow-xl border-4 border-white animate-bounce hidden md:block">
            <p className="text-white font-black text-sm whitespace-nowrap">اضغط في أي مكان للإغلاق</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
