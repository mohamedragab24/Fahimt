
"use client";

import { useState, useEffect } from "react";
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
  MessageSquare,
  Instagram,
  Twitter,
  Linkedin,
  Globe
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Facebook,
  Youtube,
  Send,
  MessageSquare,
  Instagram,
  Twitter,
  Linkedin,
  Globe
};

export function Footer() {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  return (
    <footer className="bg-white border-t mt-auto py-16" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          {/* Column 1: About */}
          <div className="space-y-6 text-right">
            <h4 className="font-black text-xl text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-primary rounded-full inline-block shrink-0"></span> عن المنصة
            </h4>
            <ul className="space-y-4">
              <FooterLink href="/about" icon={Info} label="عن فهمني" />
              <FooterLink href="/guide" icon={BookOpen} label="الدليل الإرشادي" />
              <FooterLink href="/jobs" icon={Briefcase} label="الوظائف" />
            </ul>
          </div>

          {/* Column 2: Legal */}
          <div className="space-y-6 text-right">
            <h4 className="font-black text-xl text-accent flex items-center gap-2">
              <span className="w-1.5 h-8 bg-accent rounded-full inline-block shrink-0"></span> قانونيات
            </h4>
            <ul className="space-y-4">
              <FooterLink href="/terms" icon={FileText} label="شروط الاستخدام" />
              <FooterLink href="/privacy" icon={ShieldCheck} label="سياسة الخصوصية" />
              <FooterLink href="/guarantees" icon={ShieldCheck} label="ضمان الحقوق" />
            </ul>
          </div>

          {/* Column 3: Help */}
          <div className="space-y-6 text-right">
            <h4 className="font-black text-xl text-zinc-800 flex items-center gap-2">
              <span className="w-1.5 h-8 bg-zinc-800 rounded-full inline-block shrink-0"></span> المساعدة
            </h4>
            <ul className="space-y-4">
              <FooterLink href="/support" icon={HelpCircle} label="الأسئلة الشائعة" />
              <FooterLink href="/support" icon={MessageSquare} label="تذاكر الدعم" />
              <FooterLink href="/download" icon={HelpCircle} label="تحميل التطبيق" />
            </ul>
          </div>

          {/* Column 4: Social Media */}
          <div className="space-y-6 text-right">
            <h4 className="font-black text-xl text-primary flex items-center gap-2">
              <span className="w-1.5 h-8 bg-primary rounded-full inline-block shrink-0"></span> تابعنا
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {mounted && settings?.socialLinks && settings.socialLinks.length > 0 ? (
                settings.socialLinks.map((link: any) => {
                  const Icon = ICON_MAP[link.icon] || Globe;
                  return (
                    <a 
                      key={link.id}
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-zinc-100 group"
                    >
                      <Icon size={18} style={{ color: link.color }} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black text-zinc-600">{link.label}</span>
                    </a>
                  );
                })
              ) : (
                <>
                  <SocialIconLink href="https://www.facebook.com/profile.php?id=61581756573184" icon={Facebook} label="فيسبوك" color="text-blue-600" />
                  <SocialIconLink href="https://whatsapp.com/channel/0029VbBNt0y0LKZ8hY8BWF1a" icon={MessageSquare} label="واتساب" color="text-green-500" />
                  <SocialIconLink href="https://t.me/FAHEMNY" icon={Send} label="تليجرام" color="text-blue-400" />
                  <SocialIconLink href="https://youtube.com/channel/UCd5XJWKfw-bOBpvjlW-ML2w" icon={Youtube} label="يوتيوب" color="text-red-600" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pt-12 mt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              {settings?.miniIconUrl ? (
                <img src={settings.miniIconUrl} className="h-6 w-6 object-contain" alt="Mini Logo" />
              ) : (
                <span className="text-primary font-black">ف</span>
              )}
            </div>
            <p className="text-zinc-400 text-xs font-bold">
              {settings?.footerText || "جميع الحقوق محفوظة لمنصة فهمني © ٢٠٢٤"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-black">
            صنع بكل <Heart size={12} className="text-red-500 fill-current" /> لتمكين العقل العربي
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <li>
      <Link href={href} className="text-zinc-500 hover:text-primary font-bold text-md flex items-center gap-3 transition-colors group">
        <Icon size={18} className="text-zinc-400 group-hover:text-primary transition-colors" />
        {label}
      </Link>
    </li>
  );
}

function SocialIconLink({ href, icon: Icon, label, color }: { href: string, icon: any, label: string, color: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-zinc-100 group"
    >
      <Icon size={18} className={`${color} group-hover:scale-110 transition-transform`} />
      <span className="text-xs font-black text-zinc-600">{label}</span>
    </a>
  );
}
