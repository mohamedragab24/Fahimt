
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, ShieldCheck, Clock, Phone, Mail, ExternalLink, Scale } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function RefundPolicyPage() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12 mb-20" dir="rtl">
      <div className="text-center space-y-4">
        <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <RefreshCcw size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-zinc-900">سياسة الاسترجاع</h1>
        <p className="text-muted-foreground text-xl leading-relaxed font-bold">
          نحن نسعى لتقديم أفضل مستوى من الخدمة لعملائنا داخل جمهورية مصر العربية.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-r-8 border-primary pr-4">
            <Clock className="text-primary" />
            <h2 className="text-2xl font-black text-zinc-800">1. مدة طلب الاسترجاع</h2>
          </div>
          <Card className="rounded-[2rem] border-2 bg-white p-8 shadow-sm">
            <p className="text-lg text-zinc-600 leading-relaxed font-medium">
              يحق للعميل طلب استرجاع المبلغ خلال مدة أقصاها 14 يومًا من تاريخ إتمام عملية الشراء، وذلك وفقًا لـ 
              <span className="text-primary font-black mx-1">قانون حماية المستهلك المصري رقم 181 لسنة 2018</span>.
            </p>
            <a 
              href="http://www.cpa.gov.eg/ar-eg/ConsumerProtectionLaw" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
            >
              <ExternalLink size={14} /> مرجع القانون الرسمي
            </a>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-r-8 border-accent pr-4">
            <ShieldCheck className="text-accent" />
            <h2 className="text-2xl font-black text-zinc-800">2. شروط الاسترجاع</h2>
          </div>
          <Card className="rounded-[2rem] border-2 bg-white p-8 shadow-sm space-y-4">
            <ul className="list-disc list-inside space-y-3 text-zinc-600 font-bold">
              <li>أن يكون المنتج أو الخدمة لم يتم استخدامها أو تفعيلها.</li>
              <li>في حالة الجلسات التعليمية، لا يمكن استرجاع المبلغ بعد بدء الجلسة أو تفعيل الرابط.</li>
              <li>في حالة وجود عيب فني مثبت في المنصة يمنع إتمام الخدمة، يتم مراجعة الطلب وتعويض العميل.</li>
            </ul>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-r-8 border-green-600 pr-4">
            <Scale className="text-green-600" />
            <h2 className="text-2xl font-black text-zinc-800">3. آلية رد المبلغ</h2>
          </div>
          <Card className="rounded-[2rem] border-2 bg-white p-8 shadow-sm">
            <p className="text-lg text-zinc-600 leading-relaxed font-medium">
              يتم رد المبلغ خلال <span className="text-green-600 font-black">7 إلى 14 يوم عمل</span>. 
              ويتم رد المبلغ حصراً عبر نفس وسيلة الدفع المستخدمة أثناء الشراء (بطاقة بنكية أو محفظة إلكترونية).
            </p>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-r-8 border-zinc-800 pr-4">
            <Phone className="text-zinc-800" />
            <h2 className="text-2xl font-black text-zinc-800">4. التواصل بخصوص الاسترجاع</h2>
          </div>
          <Card className="rounded-[2rem] border-2 bg-zinc-900 text-white p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl"><Mail className="text-primary" /></div>
                <div>
                  <p className="text-xs opacity-50 font-bold">البريد الإلكتروني</p>
                  <p className="font-black">support@fahimt.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl"><Phone className="text-primary" /></div>
                <div>
                  <p className="text-xs opacity-50 font-bold">الهاتف</p>
                  <p className="font-black" dir="ltr">+20 10 1234 5678</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
