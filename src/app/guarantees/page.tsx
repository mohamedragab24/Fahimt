
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Wallet, 
  Video, 
  Target, 
  Star, 
  Scale, 
  Microscope, 
  Gavel, 
  RefreshCcw, 
  UserCheck, 
  Lock, 
  AlertTriangle, 
  EyeOff, 
  Ban, 
  Filter, 
  Users,
  Info
} from "lucide-react";

export default function GuaranteesPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-20" dir="rtl">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative py-10">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 blur-3xl"></div>
        <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tight text-zinc-900 leading-tight">
          ضمان <span className="text-primary">حقوق فهمت</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-bold">
          نحن في "فهمت" نلعب دور الوسيط الضامن لتجربة عادلة ومرضية، حيث تبقى حقوقك المالية والمعرفية في أمان تام.
        </p>
      </div>

      {/* Guarantees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GuaranteeCard 
          icon={Wallet} 
          title="حجز القيمة مسبقاً" 
          desc="لا تبدأ أي جلسة في فهمت إلا بعد تأكد المنصة من وجود رصيد لا يقل عن قيمة الجلسة في حساب المستفهم."
        />
        <GuaranteeCard 
          icon={Video} 
          title="التوثيق الرقمي للجلسة" 
          desc="كل ثانية صوتية ومرئية مسجلة ومحفوظة لدى فهمت مؤقتاً لمراجعتها في حال حدوث أي نزاع."
        />
        <GuaranteeCard 
          icon={Target} 
          title="شرط تحقيق الهدف" 
          desc="لا يتم تحرير المبلغ للمفهم إلا بعد التأكد من تحقيق الهدف المرجو من الاستفهام المتفق عليه."
        />
        <GuaranteeCard 
          icon={Star} 
          title="نظام تقييم شفاف" 
          desc="تقييم حقيقي للمفهمين لا يمكن حذفه أو التلاعب به لضمان المصداقية التامة داخل فهمت."
        />
        <GuaranteeCard 
          icon={Scale} 
          title="العدالة في التقييم" 
          desc="يحق للمستخدم الاعتراض على التقييمات الكيدية، ويقوم فريق فهمت بحذفها إذا ثبت عدم صحتها."
        />
        <GuaranteeCard 
          icon={Microscope} 
          title="حماية الجهد العلمي" 
          desc="نضمن للمفهم حقه كاملاً في حال كان الشرح وافياً والمستفهم يحاول التلاعب بحقوق المنصة."
        />
        <GuaranteeCard 
          icon={Gavel} 
          title="نظام النزاعات اليدوي" 
          desc="في حال الشكوى، تتدخل إدارة فهمت للمراجعة والفصل بين الطرفين بمهنية عالية."
        />
        <GuaranteeCard 
          icon={RefreshCcw} 
          title="حق استرداد الرصيد" 
          desc="نضمن للمستفهم استرداد مبلغه كاملاً في حال ثبت عدم تمكن المفهم من إيصال المعلومة المطلوبة."
        />
        <GuaranteeCard 
          icon={UserCheck} 
          title="الاعتراف الطوعي" 
          desc="نوفر خيار الاعتراف بالخطأ للمفهم لإنهاء النزاع ودياً وتخفيف العواقب الإدارية في فهمت."
        />
        <GuaranteeCard 
          icon={Lock} 
          title="أمن بيانات الدفع" 
          desc="جميع عمليات الدفع داخل منصة فهمت مؤمنة تماماً بأحدث بروتوكولات الحماية العالمية."
        />
        <GuaranteeCard 
          icon={AlertTriangle} 
          title="حق تعليق الميزات" 
          desc="يحق لفهمت تجميد ميزات الحساب عند الاشتباه في مخالفة أمنية لحماية كافة المستخدمين."
        />
        <GuaranteeCard 
          icon={Gavel} 
          title="التحكيم الملزم" 
          desc="يكون حكم دعم فهمت بناءً على تسجيل الجلسة نهائياً وملزماً لكافة الأطراف."
        />
        <GuaranteeCard 
          icon={EyeOff} 
          title="سرية التسجيلات" 
          desc="التسجيلات مرجع لفض النزاعات فقط، ولا يحق لأي طرف تسريبها خارج إطار فهمت."
        />
        <GuaranteeCard 
          icon={Ban} 
          title="منع التعاملات الخارجية" 
          desc="الالتزام بالدفع والتواصل داخل فهمت هو الشرط الوحيد لضمان حقك القانوني والمالي."
        />
        <GuaranteeCard 
          icon={Filter} 
          title="فلترة الاستفهامات" 
          desc="نضمن عدم نشر أي محتوى يخالف الشريعة أو القانون في فهمت لضمان جودة البيئة التعليمية."
        />
      </div>

      {/* Special Guarantee Section */}
      <Card className="rounded-[3rem] bg-zinc-900 text-white overflow-hidden shadow-2xl relative border-none">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <Users size={150} />
        </div>
        <CardContent className="p-10 md:p-16 space-y-8 relative z-10 text-right">
          <div className="flex items-center gap-4 justify-end">
            <h3 className="text-3xl md:text-5xl font-black font-headline">أمان التجربة والخصوصية في فهمت</h3>
            <div className="bg-primary p-4 rounded-3xl"><Users size={40} /></div>
          </div>
          <p className="text-zinc-400 text-xl max-w-4xl mr-auto leading-relaxed font-medium">
            تجنباً لسوء الاستخدام، نضمن خصوصية التعامل التامة؛ حيث يتم توجيه طلبات الإناث للمفهمات من الإناث فقط، وطلبات الذكور للمفهمين من الذكور فقط، لضمان بيئة تعليمية آمنة ومريحة للجميع.
          </p>
          <div className="pt-6 border-t border-white/10 flex items-center gap-3 justify-end text-primary font-black">
            <Info size={20} />
            <span>نظام "فهمت" الذكي يطبق هذه القواعد آلياً لحمايتكم.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GuaranteeCard({ icon: Icon, title, desc }: any) {
  return (
    <Card className="rounded-[2.5rem] border-2 hover:border-primary/20 transition-all group overflow-hidden shadow-sm hover:shadow-xl bg-white">
      <CardHeader className="bg-muted/30 p-6 flex flex-row items-center gap-4 border-b">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
          <Icon size={20} />
        </div>
        <CardTitle className="text-lg font-black text-zinc-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-zinc-600 font-bold leading-relaxed text-sm text-right">
        {desc}
      </CardContent>
    </Card>
  );
}
