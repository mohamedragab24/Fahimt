
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, UserCheck, EyeOff, Database, Mail, Phone, ExternalLink, Globe } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12 mb-20" dir="rtl">
      <div className="text-center space-y-4">
        <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-zinc-900">سياسة الخصوصية</h1>
        <p className="text-muted-foreground text-xl leading-relaxed font-bold">
          نحن نحترم خصوصيتك ونلتزم بحماية بياناتك وفقًا لقانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.
        </p>
        <a 
          href="https://manshurat.org/node/82066" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
        >
          <ExternalLink size={14} /> مرجع القانون رقم 151 لسنة 2020
        </a>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-800 border-r-8 border-primary pr-4 flex items-center gap-2">
            <UserCheck size={24} className="text-primary" /> البيانات التي نقوم بجمعها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataPoint label="الاسم الكامل" />
            <DataPoint label="البريد الإلكتروني" />
            <DataPoint label="رقم الهاتف" />
            <DataPoint label="بيانات الدفع (لا نقوم بتخزين بيانات البطاقة البنكية)" />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-800 border-r-8 border-accent pr-4 flex items-center gap-2">
            <Globe size={24} className="text-accent" /> كيفية استخدام البيانات
          </h2>
          <Card className="rounded-[2.5rem] p-8 border-2 space-y-4">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-center gap-2 font-bold text-zinc-600"><div className="w-2 h-2 bg-accent rounded-full"/> معالجة الطلبات</li>
              <li className="flex items-center gap-2 font-bold text-zinc-600"><div className="w-2 h-2 bg-accent rounded-full"/> تقديم الدعم الفني</li>
              <li className="flex items-center gap-2 font-bold text-zinc-600"><div className="w-2 h-2 bg-accent rounded-full"/> تحسين خدماتنا</li>
              <li className="flex items-center gap-2 font-bold text-zinc-600"><div className="w-2 h-2 bg-accent rounded-full"/> التواصل مع العملاء</li>
            </ul>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-800 border-r-8 border-green-600 pr-4 flex items-center gap-2">
            <Lock size={24} className="text-green-600" /> حماية البيانات
          </h2>
          <Card className="rounded-[2.5rem] p-8 border-2 bg-green-50/30">
            <p className="font-bold text-zinc-700 leading-relaxed">
              نستخدم بروتوكول التشفير SSL لحماية المعلومات أثناء النقل. لا يتم بيع أو مشاركة بيانات العملاء مع أي طرف ثالث إلا:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Badge variant="outline" className="h-12 rounded-xl justify-center bg-white border-green-200 text-green-700">مزودي خدمات الدفع</Badge>
              <Badge variant="outline" className="h-12 rounded-xl justify-center bg-white border-green-200 text-green-700">شركات الشحن (إن وجد)</Badge>
              <Badge variant="outline" className="h-12 rounded-xl justify-center bg-white border-green-200 text-green-700">الجهات الحكومية (طلب قانوني)</Badge>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-800 border-r-8 border-primary pr-4 flex items-center gap-2">
            <EyeOff size={24} className="text-primary" /> حقوق المستخدم
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 rounded-2xl border-2 text-center space-y-2 hover:bg-primary/5 transition-colors">
              <h4 className="font-black text-primary">الاطلاع</h4>
              <p className="text-xs text-muted-foreground font-bold">حقك في الاطلاع على بياناتك المسجلة.</p>
            </Card>
            <Card className="p-6 rounded-2xl border-2 text-center space-y-2 hover:bg-primary/5 transition-colors">
              <h4 className="font-black text-primary">التعديل</h4>
              <p className="text-xs text-muted-foreground font-bold">حقك في تحديث بياناتك في أي وقت.</p>
            </Card>
            <Card className="p-6 rounded-2xl border-2 text-center space-y-2 hover:bg-primary/5 transition-colors">
              <h4 className="font-black text-primary">الحذف</h4>
              <p className="text-xs text-muted-foreground font-bold">حقك في طلب حذف بياناتك نهائياً.</p>
            </Card>
          </div>
        </section>
      </div>

      <Card className="rounded-[3rem] bg-zinc-900 text-white p-10 text-center space-y-4 shadow-2xl">
        <h3 className="text-2xl font-black">لأي استفسار بخصوص الخصوصية</h3>
        <p className="text-primary font-black text-xl">privacy@fahimt.com</p>
      </Card>
    </div>
  );
}

function DataPoint({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border">
      <div className="w-2 h-2 bg-primary rounded-full" />
      <span className="font-bold text-zinc-700">{label}</span>
    </div>
  );
}
