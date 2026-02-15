
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Info, 
  Target, 
  ShieldCheck, 
  Zap, 
  Users, 
  MessageSquare, 
  Globe, 
  Award,
  Sparkles
} from "lucide-react";
import Image from "next/image";
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
      <div className="text-center space-y-6 relative py-10">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 blur-3xl"></div>
        <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <Info size={48} />
        </div>
        <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tight text-zinc-900 leading-tight">
          عن <span className="text-primary">{settings?.siteTitle || "فهمني"}</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-bold">
          المنصة العربية الأولى المتخصصة في طلب وتقديم خدمات الشرح الفوري التفاعلي.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="border-r-8 border-primary pr-6">
            <h2 className="text-3xl font-black text-zinc-800 mb-4">ما هي منصة فهمني؟</h2>
            <p className="text-zinc-600 text-xl leading-relaxed font-medium">
              فهمني هي المنصة العربية الأولى المتخصصة في طلب وتقديم خدمات الشرح الفوري التفاعلي لأغلب التخصصات الأكاديمية والتقنية والمهارية. 
              نحن نعمل على ربط الباحثين عن المعرفة <span className="text-primary font-black">(المستفهمين)</span> بنخبة من الخبراء وأصحاب أساليب الشرح المبسط <span className="text-accent font-black">(المفهمين)</span>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        <Card className="rounded-[3.5rem] border-4 border-white shadow-2xl overflow-hidden bg-primary/5 group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 opacity-50"></div>
          <CardContent className="p-12 space-y-6 relative z-10">
            <h3 className="text-2xl font-black text-primary flex items-center gap-3">
              <Sparkles className="animate-pulse" /> رؤيتنا ورسالتنا
            </h3>
            <p className="text-zinc-700 text-lg leading-relaxed font-bold italic">
              "نسعى لمساعدة الطلاب والمحترفين على استيعاب النقاط الصعبة وتجاوز التحديات التقنية أو المهارية من خلال وسيط يضمن الحقوق المالية والمعرفية للجميع، مع الالتزام التام بالخصوصية وحقوق الملكية."
            </p>
            <div className="pt-6 border-t border-primary/10 flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm">
                <ShieldCheck className="text-green-600" />
              </div>
              <span className="font-black text-zinc-600">بيئة تعليمية آمنة ومسجلة</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats/Values Section */}
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
          desc="نضمن حقوق الطرفين المالية من خلال نظام وساطة مالي آمن."
        />
      </div>

      {/* Final Note Card */}
      <Card className="rounded-[3rem] bg-zinc-900 text-white overflow-hidden shadow-2xl">
        <CardContent className="p-10 md:p-16 text-center space-y-8 relative">
          <div className="absolute top-0 left-0 p-10 opacity-10 rotate-12">
            <MessageSquare size={120} />
          </div>
          <h3 className="text-3xl md:text-5xl font-black font-headline leading-tight">ابدأ رحلة "الفهم" اليوم</h3>
          <p className="text-zinc-400 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            تتيح لك المنصة طرح "استفهامك" مجاناً لتتلقى عروضاً من مفهمين موثقين، ثم اختيار الأنسب لبدء جلسة تفهيم موثقة ومسجلة تحفظ حقك المعرفي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-4 items-start p-4 bg-white rounded-2xl border-2 border-transparent hover:border-primary/10 hover:shadow-lg transition-all">
      <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-black text-zinc-800">{title}</h4>
        <p className="text-xs text-muted-foreground font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc }: any) {
  return (
    <Card className="rounded-[2.5rem] border-2 hover:border-primary transition-all group overflow-hidden shadow-sm hover:shadow-xl bg-white text-center">
      <CardHeader className="pt-10">
        <div className="bg-zinc-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-zinc-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
          <Icon size={32} />
        </div>
        <CardTitle className="text-xl font-black text-zinc-800 mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-10 px-8 text-zinc-500 font-bold leading-relaxed text-sm">
        {desc}
      </CardContent>
    </Card>
  );
}
