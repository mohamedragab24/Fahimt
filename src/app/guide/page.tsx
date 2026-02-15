
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  GraduationCap, 
  User, 
  Briefcase, 
  Clock, 
  ShieldCheck, 
  Download, 
  UserCheck, 
  Laptop, 
  Wrench, 
  Mic2, 
  AlertTriangle, 
  XCircle,
  Type,
  FileText,
  Target,
  ImageIcon,
  BadgeCent,
  Wallet,
  RefreshCcw,
  ClipboardList,
  MessageSquare,
  Video,
  Star,
  Info
} from "lucide-react";

export default function GuidePage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-20" dir="rtl">
      <div className="text-center space-y-4">
        <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner">
          <BookOpen size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-zinc-900">الدليل الإرشادي</h1>
        <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed font-medium">
          الدليل الشامل لمستخدمي منصة "فهمني" لضمان تجربة تعليمية مثمرة وسلسة للطرفين.
        </p>
      </div>

      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-20 p-2 bg-muted/50 rounded-[2rem] mb-12">
          <TabsTrigger value="student" className="rounded-[1.5rem] text-xl font-black data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
            <User className="ml-3 h-6 w-6" /> دليل المستفهم
          </TabsTrigger>
          <TabsTrigger value="teacher" className="rounded-[1.5rem] text-xl font-black data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
            <GraduationCap className="ml-3 h-6 w-6" /> دليل المفهم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GuideCard icon={Type} title="صياغة العنوان" content="يجب أن يكون عنوان الاستفهام مختصراً ومعبراً عن جوهر المعلومة المطلوبة بدقة." />
            <GuideCard icon={FileText} title="وصف المشكلة" content="ننصح المستفهم بكتابة كافة تفاصيل الجزئية التي يريد فهمها ليصل إلى المفهم المناسب." />
            <GuideCard icon={Target} title="أهداف الاستفهام" content="اكتب الهدف النهائي الذي تريد الوصول له بوضوح؛ فهو المرجع في حال تقديم شكوى." />
            <GuideCard icon={ImageIcon} title="استخدام الوسائط" content="ارفق الصور أو الملفات اللازمة لتساعد المفهمين على استيعاب طلبك قبل تقديم عروضهم." />
            <GuideCard icon={BadgeCent} title="الميزانية والموعد" content="ضع سعراً يتناسب مع صعوبة المعلومة؛ فالميزانية الجيدة تجذب مفهمين أكثر كفاءة." />
            <GuideCard icon={Wallet} title="شحن الرصيد" content="يتم الشحن عبر الوسائل المتاحة، ويظل المبلغ 'معلقاً' حتى تنتهي من فهم معلومتك تماماً." />
            <GuideCard icon={RefreshCcw} title="استعادة الرصيد" content="يمكنك استعادة الرصيد المشحون وغير المستخدم بتقديم طلب سحب عبر الوسائل المتاحة." />
            <GuideCard icon={ClipboardList} title="مراجعة العروض" content="قارن بين تقييمات المفهمين وخبراتهم في معرض أعمالهم قبل قبول أي عرض." />
            <GuideCard icon={MessageSquare} title="التواصل المباشر" content="استخدم دردشة المنصة للاستفسار من المفهم قبل قبول عرضه لضمان ملاءمته لطلبك." />
            <GuideCard icon={Mic2} title="تجهيز البيئة" content="تأكد من وجودك في مكان هادئ واتصال إنترنت مستقر لضمان جودة الصوت والصورة." />
            <GuideCard icon={User} title="التفاعل والوقت" content="لا تخجل من مقاطعة المفهم لطلب إعادة أي نقطة؛ فالوقت ملكك والهدف هو فهمك." />
            <GuideCard icon={Video} title="إدارة الجلسة" content="استخدم الميكروفون والكاميرا بوضوح، ووجه المفهم للنقاط التي لم تستوعبها بعد." />
            <GuideCard icon={UserCheck} title="توثيق الهوية" content="تستطيع الاستفادة من أول استفهام فقط قبل أن يطلب منك توثيق هويتك رسمياً." />
            <GuideCard icon={Laptop} title="المهارات التقنية" content="يمكنك طلب الشرح في استخدام التطبيقات أو البرامج أو تعلم أي مهارة تقنية رقمية." />
            <GuideCard icon={Wrench} title="المهارات اليدوية" content="يمكنك طلب شرح طرق التصليح أو الطبخ أو أي مهارة يدوية وحرفية أخرى." />
            <GuideCard icon={Star} title="تقييم الجلسة" content="لا تنس وضع تقييم حقيقي بعد الانتهاء؛ فهو يساعد غيرك على اختيار المفهم الأفضل." />
          </div>
          <AlertBox title="الممنوع الاستفهام عنه" content="يمنع منعاً باتاً طلب استفهام في أي شيء مخالف للشرع أو القانون، أو الاستشارات الطبية والقانونية والدينية." />
        </TabsContent>

        <TabsContent value="teacher" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GuideCard icon={Briefcase} title="معرض الأعمال" content="ضع نماذج شرح (فيديوهات قصيرة) تعبر عن مهاراتك لزيادة فرص اختيارك من الطلاب." />
            <GuideCard icon={Clock} title="الالتزام بالمواعيد" content="تقديمك للعرض يعني تفرغك التام في الموعد المحدد؛ احرص على التواجد في الموعد." />
            <GuideCard icon={ShieldCheck} title="التحقق من التخصص" content="لا تقدم عروضاً على مواضيع لا تتقنها؛ فالجودة المنخفضة قد تؤدي لإيقاف حسابك." />
            <GuideCard icon={Download} title="سحب الأرباح" content="تنتقل الأرباح لرصيدك فور تأكيد الطالب فهمه، ويمكنك سحبها عبر الوسائل المتاحة." />
            <GuideCard icon={UserCheck} title="توثيق الهوية" content="يجب عليك توثيق هويتك كخبير قبل التمكن من تقديم أول عرض تفهيم في المنصة." />
            <GuideCard icon={BookOpen} title="الموضوعات العلمية" content="يمكنك تقديم شروحات في أي مادة دراسية من المرحلة الابتدائية وحتى الجامعية." />
            <GuideCard icon={Laptop} title="المهارات التقنية" content="قدم خبراتك في تعليم البرامج أو المهارات التقنية المختلفة التي يحتاجها الطلاب." />
            <GuideCard icon={Wrench} title="المهارات اليدوية" content="يمكنك تقديم شروحات عملية في طرق التصليح أو الطبخ أو أي حرفة يدوية تتقنها." />
            <GuideCard icon={Mic2} title="تجهيز البيئة" content="تأكد من الهدوء واستقرار الإنترنت لتقديم شرح احترافي يليق بخبرتك ويحفظ تقييمك." />
            <GuideCard icon={AlertTriangle} title="الانسحاب الطارئ" content="في حال تعذر الإكمال لظرف طارئ، يجب إبلاغ الطرف الآخر فوراً وفتح تذكرة دعم." />
          </div>
          <AlertBox title="الممنوع تفهيمه" content="يمنع تماماً تقديم تفهيم في أي شيء مخالف للشرع أو القانون، أو تقديم استشارات طبية أو قانونية أو دينية." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuideCard({ icon: Icon, title, content }: any) {
  return (
    <Card className="rounded-[2rem] border-2 hover:border-primary/20 transition-all group overflow-hidden shadow-sm hover:shadow-xl bg-white">
      <CardHeader className="bg-muted/30 p-6 flex flex-row items-center gap-4 border-b">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
          <Icon size={20} />
        </div>
        <CardTitle className="text-lg font-black text-zinc-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-zinc-600 font-bold leading-relaxed text-sm">
        {content}
      </CardContent>
    </Card>
  );
}

function AlertBox({ title, content }: any) {
  return (
    <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-dashed border-red-200 flex items-start gap-6">
      <div className="bg-red-100 p-4 rounded-3xl text-red-600 shrink-0">
        <XCircle size={32} />
      </div>
      <div>
        <h4 className="text-2xl font-black text-red-900 mb-2">{title}</h4>
        <p className="text-red-800 text-lg font-bold leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
