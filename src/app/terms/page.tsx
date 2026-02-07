
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileText, Scale, Lock } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12" dir="rtl">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">الشروط والأحكام</h1>
        <p className="text-muted-foreground text-xl leading-relaxed">يرجى قراءة شروط استخدام منصة "فهمني" بعناية لضمان أفضل تجربة تعليمية.</p>
      </div>

      <div className="space-y-8">
        <TermsSection 
          icon={ShieldCheck} 
          title="التزامات المستخدم" 
          content="يجب على جميع المستخدمين (طلاب ومعلمين) احترام القواعد الأخلاقية والمهنية. يمنع منعاً باتاً تبادل المعلومات الشخصية خارج المنصة أو استخدام لغة غير لائقة."
        />
        <TermsSection 
          icon={Scale} 
          title="السياسة المالية" 
          content="يتم خصم الرسوم بمجرد قبول المحاضرة واكتمالها. يحق للمنصة خصم عمولة قدرها 20% لتطوير الخدمات وضمان الأمان. طلبات السحب تتم خلال 24 ساعة عمل."
        />
        <TermsSection 
          icon={Lock} 
          title="الخصوصية والأمان" 
          content="جميع المحادثات والبث المباشر مشفر تماماً. لا يتم تسجيل المحاضرات إلا في حالات استثنائية وبموافقة الطرفين أو لأغراض الرقابة الإدارية في حال وجود شكوى."
        />
        <TermsSection 
          icon={FileText} 
          title="تعديل الشروط" 
          content="تحتفظ منصة 'فهمني' بالحق في تعديل هذه الشروط في أي وقت، وسيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو تنبيهات النظام."
        />
      </div>

      <Card className="rounded-[2.5rem] border-2 border-primary/10 bg-primary/5 p-10 text-center">
        <CardContent className="space-y-4">
          <h3 className="text-2xl font-black text-primary">هل لديك استفسار؟</h3>
          <p className="text-muted-foreground font-medium">إذا كان لديك أي سؤال حول الشروط، يمكنك دائماً التواصل مع فريق الدعم الفني عبر التطبيق.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TermsSection({ icon: Icon, title, content }: any) {
  return (
    <Card className="rounded-[2rem] border-2 hover:border-primary transition-all overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/30 p-8 flex flex-row items-center gap-4">
        <div className="bg-primary p-3 rounded-2xl text-white">
          <Icon size={24} />
        </div>
        <CardTitle className="text-2xl font-black">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-8 text-lg text-muted-foreground leading-relaxed font-medium">
        {content}
      </CardContent>
    </Card>
  );
}
