
"use client";

import Link from "next/link";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ShieldCheck, Heart, Info, FileText, HelpCircle, Briefcase, BookOpen } from "lucide-react";

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  return (
    <footer className="bg-white border-t mt-auto py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo & Text */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white font-black">
              {settings?.miniIconUrl ? <img src={settings.miniIconUrl} className="w-full h-full object-cover rounded-xl" /> : "ف"}
            </div>
            <span className="text-2xl font-black text-primary">{settings?.siteTitle || "فهمني"}</span>
          </div>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            المنصة العربية الأولى لطلب وتقديم خدمات الشرح الفوري. نربط العقول الطموحة بالخبراء الموثقين.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="space-y-4">
          <h4 className="font-black text-zinc-900 border-r-4 border-primary pr-3">عن المنصة</h4>
          <ul className="space-y-3">
            <li><Link href="/about" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><Info size={14}/> عن فهمني</Link></li>
            <li><Link href="/guide" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><BookOpen size={14}/> الدليل الإرشادي</Link></li>
            <li><Link href="/jobs" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><Briefcase size={14}/> الوظائف</Link></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="space-y-4">
          <h4 className="font-black text-zinc-900 border-r-4 border-accent pr-3">قانونيات</h4>
          <ul className="space-y-3">
            <li><Link href="/terms" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><FileText size={14}/> شروط الاستخدام</Link></li>
            <li><Link href="/privacy" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><ShieldCheck size={14}/> سياسة الخصوصية</Link></li>
            <li><Link href="/guarantees" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><ShieldCheck size={14}/> ضمان الحقوق</Link></li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div className="space-y-4">
          <h4 className="font-black text-zinc-900 border-r-4 border-zinc-800 pr-3">المساعدة</h4>
          <ul className="space-y-3">
            <li><Link href="/support" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><HelpCircle size={14}/> الأسئلة الشائعة</Link></li>
            <li><Link href="/support" className="text-zinc-600 hover:text-primary font-bold text-sm flex items-center gap-2"><HelpCircle size={14}/> تذاكر الدعم</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-zinc-400 text-xs font-bold">
          {settings?.footerText || "جميع الحقوق محفوظة لمنصة فهمني © ٢٠٢٤"}
        </p>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-black">
          صنع بكل <Heart size={12} className="text-red-500 fill-current" /> لتمكين العقل العربي
        </div>
      </div>
    </footer>
  );
}
