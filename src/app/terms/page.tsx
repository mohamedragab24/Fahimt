
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { 
  FileText, 
  AlertCircle
} from "lucide-react";

/**
 * صفحة شروط الاستخدام المحدثة - قائمة طولية احترافية.
 */
export default function TermsPage() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings } = useDoc(settingsRef);

  const terms = [
    {
      title: "عدم إنشاء أكثر من حساب",
      desc: "يسمح بحساب واحد فقط لكل شخص؛ إنشاء أكثر من حساب يعرض جميع الحسابات للحظر النهائي."
    },
    {
      title: "الاستخدام الشخصي فقط",
      desc: "المستخدم المسجل هو الوحيد المسؤول عن حسابه، ولا يسمح للشركات أو فرق العمل باستخدام حساب فردي."
    },
    {
      title: "عمولة المنصة",
      desc: "تقتطع عمولة (20%) من أرباح المفهم ولا يحق له طلب تحميلها للمستفهم بشكل إضافي."
    },
    {
      title: "الدفع الخارجي",
      desc: "عرض أو طلب الدفع خارج المنصة يؤدي للحظر الفوري والنهائي دون الرجوع للمستخدم."
    },
    {
      title: "التواصل الخارجي",
      desc: "الإصرار على التواصل خارج المنصة دون ضرورة تقنية يرفع يد المنصة عن ضمان الحقوق ويعرضك للحظر."
    },
    {
      title: "جودة المحتوى",
      desc: "يمنع تسليم 'تفهيم' منخفض الجودة أو الاعتماد على ترجمة آلية أو أدوات ذكاء اصطناعي دون شرح بشري."
    },
    {
      title: "الوساطة الممنوعة",
      desc: "يحظر على المفهم لعب دور الوسيط (استلام طلب ثم توظيف شخص آخر لتنفيذه)؛ الحساب للأفراد فقط."
    },
    {
      title: "المحتوى الفكري",
      desc: "لا يحق للمستفهم تسجيل الجلسة لاستخدامها خارج المنصة سواء كان استخداماً تجارياً أو غير تجاري."
    },
    {
      title: "الاستخدام السياسي والديني",
      desc: "يحظر استخدام الموقع لأغراض سياسية أو طائفية أو الإساءة لأي دولة أو معتقد."
    },
    {
      title: "الاستشارات والفتاوى",
      desc: "يمنع منعاً باتاً استخدام المنصة للاستشارات الطبية أو القانونية أو الفتاوى الدينية؛ وأي استخدام لها هو على المسؤولية الشخصية."
    },
    {
      title: "وسائل الدفع",
      desc: "يمنع استخدام بطاقات ائتمانية أو حسابات مسروقة؛ اكتشاف ذلك يؤدي للملاحقة القانونية الفورية."
    },
    {
      title: "إلغاء الاستفهامات",
      desc: "إلغاء المفهم للاستفهامات التي قبلها بشكل متكرر دون سبب جوهري قد يعرض حسابه للتقييد."
    },
    {
      title: "حق الحذف",
      desc: "للمنصة الحق في حذف أي 'استفهام' أو 'عرض' أو 'عمل' تراه مخالفاً أو يسبب ضرراً للمستخدمين."
    },
    {
      title: "المنازعات القانونية",
      desc: "تخضع كافة الشروط لقوانين الدولة المقر للمنصة، وتفصل المحاكم بها في حال تعذر الحل الودي."
    },
    {
      title: "التوثيق الإلزامي",
      desc: "يمنع سحب الأرباح من الحساب إلا بعد توثيق الهوية الشخصية رسمياً لضمان الأمان المالي."
    },
    {
      title: "الحد الأدنى للسحب",
      desc: "يمكنك سحب أرباحك بالحد الأدنى للسحب الخاص بوسيلة السحب المتاحة والمختارة في حسابك."
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-16 mb-20" dir="rtl">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative py-10">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 blur-3xl"></div>
        <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <FileText size={48} />
        </div>
        <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tight text-zinc-900">
          <span className="text-primary">{settings?.termsTitle || "شروط استخدام فهمت"}</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-black">
          {settings?.termsDescription || "استخدامك لـ 'فهمت' يعني موافقتك الكاملة وغير المشروطة على هذه الشروط المنظمة للعلاقة بيننا."}
        </p>
      </div>

      {/* Terms List - Vertical Standard Layout */}
      <div className="space-y-12">
        {terms.map((item, index) => (
          <div key={index} className="space-y-3 border-r-8 border-primary/10 pr-8 group hover:border-primary transition-all py-2">
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">
              {item.title}
            </h3>
            <p className="text-lg md:text-xl text-zinc-600 font-bold leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Modification Notice Card */}
      <Card className="rounded-[3rem] bg-zinc-900 text-white overflow-hidden shadow-2xl border-none">
        <CardContent className="p-10 md:p-16 text-center space-y-8 relative">
          <div className="flex justify-center">
            <div className="bg-primary/20 p-4 rounded-3xl text-primary shadow-inner">
              <AlertCircle size={48} />
            </div>
          </div>
          <h3 className="text-3xl md:text-5xl font-black font-headline">تعديل الشروط والأحكام</h3>
          <p className="text-zinc-400 text-xl md:text-2xl max-w-3xl mx-auto font-black leading-relaxed">
            يمكن لـ "فهمت" تعديل هذه الشروط في أي وقت، ويعتبر استمرارك في الاستخدام موافقة على التعديلات، لذا يرجى متابعة هذه الصفحة باستمرار للبقاء على اطلاع دائم.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
