
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldCheck, 
  FileText, 
  Scale, 
  Lock, 
  Users, 
  User, 
  BadgeCent, 
  Ban, 
  MessageSquareOff, 
  Award, 
  Users2, 
  Copyright, 
  Flag, 
  Stethoscope, 
  CreditCard, 
  XCircle, 
  Trash2, 
  ArrowDownToLine,
  AlertCircle
} from "lucide-react";

export default function TermsPage() {
  const terms = [
    {
      icon: Users,
      title: "عدم إنشاء أكثر من حساب",
      desc: "يسمح بحساب واحد فقط لكل شخص؛ إنشاء أكثر من حساب يعرض جميع الحسابات للحظر النهائي."
    },
    {
      icon: User,
      title: "الاستخدام الشخصي فقط",
      desc: "المستخدم المسجل هو الوحيد المسؤول عن حسابه، ولا يسمح للشركات أو فرق العمل باستخدام حساب فردي."
    },
    {
      icon: BadgeCent,
      title: "عمولة المنصة",
      desc: "تقتطع عمولة (20%) من أرباح المفهم ولا يحق له طلب تحميلها للمستفهم بشكل إضافي."
    },
    {
      icon: Ban,
      title: "الدفع الخارجي",
      desc: "عرض أو طلب الدفع خارج المنصة يؤدي للحظر الفوري والنهائي دون الرجوع للمستخدم."
    },
    {
      icon: MessageSquareOff,
      title: "التواصل الخارجي",
      desc: "الإصرار على التواصل خارج المنصة دون ضرورة تقنية يرفع يد المنصة عن ضمان الحقوق ويعرضك للحظر."
    },
    {
      icon: Award,
      title: "جودة المحتوى",
      desc: "يمنع تسليم 'تفهيم' منخفض الجودة أو الاعتماد على ترجمة آلية أو أدوات ذكاء اصطناعي دون شرح بشري."
    },
    {
      icon: Users2,
      title: "الوساطة الممنوعة",
      desc: "يحظر على المفهم لعب دور الوسيط (استلام طلب ثم توظيف شخص آخر لتنفيذه)؛ الحساب للأفراد فقط."
    },
    {
      icon: Copyright,
      title: "المحتوى الفكري",
      desc: "لا يحق للمستفهم تسجيل الجلسة لاستخدامها خارج المنصة سواء كان استخداماً تجارياً أو غير تجاري."
    },
    {
      icon: Flag,
      title: "الاستخدام السياسي والديني",
      desc: "يحظر استخدام الموقع لأغراض سياسية أو طائفية أو الإساءة لأي دولة أو معتقد."
    },
    {
      icon: Stethoscope,
      title: "الاستشارات والفتاوى",
      desc: "يمنع منعاً باتاً استخدام المنصة للاستشارات الطبية أو القانونية أو الفتاوى الدينية؛ وأي استخدام لها هو على المسؤولية الشخصية."
    },
    {
      icon: CreditCard,
      title: "وسائل الدفع",
      desc: "يمنع استخدام بطاقات ائتمانية أو حسابات مسروقة؛ اكتشاف ذلك يؤدي للملاحقة القانونية الفورية."
    },
    {
      icon: XCircle,
      title: "إلغاء الاستفهامات",
      desc: "إلغاء المفهم للاستفهامات التي قبلها بشكل متكرر دون سبب جوهري قد يعرض حسابه للتقييد."
    },
    {
      icon: Trash2,
      title: "حق الحذف",
      desc: "للمنصة الحق في حذف أي 'استفهام' أو 'عرض' أو 'عمل' تراه مخالفاً أو يسبب ضرراً للمستخدمين."
    },
    {
      icon: Scale,
      title: "المنازعات القانونية",
      desc: "تخضع كافة الشروط لقوانين الدولة المقر للمنصة، وتفصل المحاكم بها في حال تعذر الحل الودي."
    },
    {
      icon: ShieldCheck,
      title: "التوثيق الإلزامي",
      desc: "يمنع سحب الأرباح من الحساب إلا بعد توثيق الهوية الشخصية رسمياً لضمان الأمان المالي."
    },
    {
      icon: ArrowDownToLine,
      title: "الحد الأدنى للسحب",
      desc: "يمكنك سحب أرباحك بالحد الأدنى للسحب الخاص بوسيلة السحب المتاحة والمختارة في حسابك."
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-20" dir="rtl">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative py-10">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 blur-3xl"></div>
        <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <FileText size={48} />
        </div>
        <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tight text-zinc-900">
          شروط <span className="text-primary">الاستخدام</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-bold">
          استخدامك لـ "فهمني" يعني موافقتك الكاملة وغير المشروطة على هذه الشروط المنظمة للعلاقة بيننا.
        </p>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terms.map((item, index) => (
          <Card key={index} className="rounded-[2.5rem] border-2 hover:border-primary/20 transition-all group overflow-hidden shadow-sm hover:shadow-xl bg-white flex flex-col">
            <CardHeader className="bg-muted/30 p-6 flex flex-row items-center gap-4 border-b">
              <div className="bg-primary p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                <item.icon size={20} />
              </div>
              <CardTitle className="text-lg font-black text-zinc-800">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-zinc-600 font-bold leading-relaxed text-sm flex-1">
              {item.desc}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modification Notice */}
      <Card className="rounded-[3rem] bg-zinc-900 text-white overflow-hidden shadow-2xl border-none">
        <CardContent className="p-10 md:p-16 text-center space-y-8 relative">
          <div className="flex justify-center">
            <div className="bg-primary/20 p-4 rounded-3xl text-primary">
              <AlertCircle size={40} />
            </div>
          </div>
          <h3 className="text-2xl md:text-4xl font-black font-headline">تعديل الشروط والأحكام</h3>
          <p className="text-zinc-400 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            يمكن لـ "فهمني" تعديل هذه الشروط في أي وقت، ويعتبر استمرارك في الاستخدام موافقة على التعديلات، لذا يرجى متابعة هذه الصفحة باستمرار للبقاء على اطلاع دائم.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
