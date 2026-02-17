
"use client";

import Link from "next/link";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { 
  ShieldCheck, 
  Heart, 
  Info, 
  FileText, 
  HelpCircle, 
  Briefcase, 
  BookOpen, 
  Facebook, 
  Youtube, 
  Send, 
  MessageSquare 
} from "lucide-react";

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  return (
    <footer className="bg-white border-t mt-auto py-16" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo & Description */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-lg overflow-hidden">
              {settings?.miniIconUrl ? (
                <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <span className="text-2xl">ف</span>
              )}
            </div>
            <span className="text-3xl font-black text-primary">{settings?.siteTitle || "فهمني"}</span>
          </div>
          <p className="text-muted-foreground text-sm font-bold leading-relaxed text-center md:text-right max-w-xs">
            المنصة العربية الأولى لطلب وتقديم خدمات الشرح الفوري. نربط العقول الطموحة بالخبراء الموثقين.
          </p>
          
          {/* Social Links Icons */}
          <div className="flex items-center gap-4 justify-center md:justify-start pt-4">
            {settings?.telegramUrl && (
              <a href={settings.telegramUrl} target="_blank" className="bg-zinc-50 p-3 rounded-2xl text-blue-500 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm">
                <Send size={24}/>
              </a>
            )}
            {settings?.whatsappUrl && (
              <a href={settings.whatsappUrl} target="_blank" className="bg-zinc-50 p-3 rounded-2xl text-green-500 hover:bg-green-50 hover:scale-110 transition-all shadow-sm">
                <MessageSquare size={24}/>
              </a>
            )}
            {settings?.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" className="bg-zinc-50 p-3 rounded-2xl text-blue-700 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm">
                <Facebook size={24}/>
              </a>
            )}
            {settings?.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" className="bg-zinc-50 p-3 rounded-2xl text-red-600 hover:bg-red-50 hover:scale-110 transition-all shadow-sm">
                <Youtube size={24}/>
              </a>
            )}
          </div>
        </div>

        {/* Links Column 1: About */}
        <div className="space-y-6 text-center md:text-right">
          <h4 className="font-black text-xl text-zinc-900 flex items-center justify-center md:justify-start gap-2">
            <div className="w-1.5 h-8 bg-primary rounded-full hidden md:block"></div> عن المنصة
          </h4>
          <ul className="space-y-4">
            <FooterLink href="/about" icon={Info} label="عن فهمني" />
            <FooterLink href="/guide" icon={BookOpen} label="الدليل الإرشادي" />
            <FooterLink href="/jobs" icon={Briefcase} label="الوظائف" />
          </ul>
        </div>

        {/* Links Column 2: Legal */}
        <div className="space-y-6 text-center md:text-right">
          <h4 className="font-black text-xl text-accent flex items-center justify-center md:justify-start gap-2">
            <div className="w-1.5 h-8 bg-accent rounded-full hidden md:block"></div> قانونيات
          </h4>
          <ul className="space-y-4">
            <FooterLink href="/terms" icon={FileText} label="شروط الاستخدام" />
            <FooterLink href="/privacy" icon={ShieldCheck} label="سياسة الخصوصية" />
            <FooterLink href="/guarantees" icon={ShieldCheck} label="ضمان الحقوق" />
          </ul>
        </div>

        {/* Links Column 3: Help */}
        <div className="space-y-6 text-center md:text-right">
          <h4 className="font-black text-xl text-zinc-800 flex items-center justify-center md:justify-start gap-2">
            <div className="w-1.5 h-8 bg-zinc-800 rounded-full hidden md:block"></div> المساعدة
          </h4>
          <ul className="space-y-4">
            <FooterLink href="/support" icon={HelpCircle} label="الأسئلة الشائعة" />
            <FooterLink href="/support" icon={HelpCircle} label="تذاكر الدعم" />
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

function FooterLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <li>
      <Link href={href} className="text-zinc-500 hover:text-primary font-bold text-md flex items-center justify-center md:justify-start gap-3 transition-colors group">
        <Icon size={18} className="text-zinc-400 group-hover:text-primary transition-colors" />
        {label}
      </Link>
    </li>
  );
}
