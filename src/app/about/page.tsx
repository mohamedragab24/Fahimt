
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Info, 
  ShieldCheck, 
  Zap, 
  Users, 
  MessageSquare, 
  Globe, 
  Award
} from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function AboutPage() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-16 mb-20" dir="rtl">
      {/* Hero Section */}
      <div className="text-center space-y-8 relative py-20">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 blur-3xl"></div>
        <div className="bg-primary/10 w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-8">
          <Info size={64} />
        </div>
        <h1 className="text-5xl md:text-8xl font-black font-headline tracking-tight text-zinc-900 leading-tight">
          عن منصة <span className="text-primary">{settings?.siteTitle || "فهمت"}</span>
        </h1>
        <p className="text-2xl md:text-4xl max-w-4xl mx-auto leading-relaxed font-black text-zinc-700">
          المنصة العربية الأولى المتخصصة في طلب وتقديم خدمات الشرح الفوري التفاعلي.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-12">
        <div className="border-r-[12px] border-primary pr-10 text-right">
          <h2 className="text-4xl md:text-5xl font-black text-zinc-800 mb-8">{settings?.aboutTitle || "ما هي منصة فهمت؟"}</h2>
          <p className="text-zinc-600 text-2xl md:text-3xl leading-relaxed font-bold">
            {settings?.aboutDescription || "فهمت هي المنصة العربية الأولى المتخصصة في طلب وتقديم خدمات الشرح الفوري التفاعلي لأغلب التخصصات الأكاديمية والتقنية والمهارية. نحن نعمل على ربط الباحثين عن المعرفة بنخبة من الخبراء وأصحاب أساليب الشرح المبسط."}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <FeatureItem 
            icon={Zap} 
            title="شرح فوري" 
            desc="تجاوز التحديات التعليمية في جلسات تفاعلية مباشرة ولحظية."
          />
          <FeatureItem 
            icon={Award} 
            title="خبراء موثقون" 
            desc="نخبة من المفهمين المعتمدين لضمان جودة المعلومة."
          />
        </div>
      </div>

      {/* Values Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ValueCard 
          icon={Users} 
          title="الربط الذكي" 
          desc="نربط بين المستفهم والمفهم الأنسب بناءً على التخصص والتقييمات."
        />
        <ValueCard 
          icon={Globe} 
          title="تخصصات متنوعة" 
          desc="سواء كانت أكاديمية، تقنية، أو عملية؛ ستجد من يفهمك هنا."
        />
        <ValueCard 
          icon={ShieldCheck} 
          title="ضمان الحقوق" 
          desc="نضمن حقوق الطرفين المالية من خلال نظام وساطة مالي آمن في فهمت."
        />
      </div>

      {/* Final Note Card */}
      <Card className="rounded-[4rem] bg-zinc-900 text-white overflow-hidden shadow-2xl relative border-none">
        <div className="absolute top-0 left-0 p-10 opacity-10 rotate-12">
          <MessageSquare size={150} />
        </div>
        <CardContent className="p-12 md:p-24 text-center space-y-10 relative z-10">
          <h3 className="text-4xl md:text-6xl font-black font-headline leading-tight">ابدأ رحلة "فهمت" اليوم</h3>
          <p className="text-zinc-400 text-2xl md:text-3xl max-w-4xl mx-auto font-bold leading-relaxed">
            تتيح لك منصة فهمت طرح "استفهامك" مجاناً لتتلقى عروضاً من مفهمين موثقين، ثم اختيار الأنسب لبدء جلسة تفهيم موثقة ومسجلة تحفظ حقك المعرفي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-6 items-start p-8 bg-white rounded-3xl border-4 border-transparent hover:border-primary/10 hover:shadow-2xl transition-all">
      <div className="bg-primary/10 p-5 rounded-2xl text-primary shrink-0">
        <Icon size={32} />
      </div>
      <div className="text-right">
        <h4 className="text-2xl font-black text-zinc-800 mb-2">{title}</h4>
        <p className="text-lg text-muted-foreground font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }: any) {
  return (
    <Card className="rounded-[3rem] border-4 border-zinc-50 hover:border-primary transition-all group overflow-hidden shadow-sm hover:shadow-2xl bg-white text-center">
      <CardHeader className="pt-12">
        <div className="bg-zinc-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-zinc-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
          <Icon size={40} />
        </div>
        <CardTitle className="text-2xl font-black text-zinc-800 mt-6">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-12 px-10 text-zinc-500 font-bold leading-relaxed text-lg">
        {desc}
      </CardContent>
    </Card>
  );
}
