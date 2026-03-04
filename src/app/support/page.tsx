
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  History, 
  Plus, 
  Hash, 
  MessageSquare,
  User,
  GraduationCap,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRouter } from "next/navigation";

const FAQS_DATA = {
  general: [
    { q: "ما هي منصة فهمت وما الذي يميزها؟", a: "منصة فهمت هي وسيط تقني يربط بين المستفهم (من يبحث عن معلومة أو شرح سريع) و المفهم (صاحب الخبرة والقدرة على الشرح). ما يميزنا هو التخصص في 'الفهم اللحظي' عبر جلسات مسجلة تضمن حق الطرفين، مع مراعاة الخصوصية التامة بفصل الجنسين في التعامل." },
    { q: "كيف تضمن المنصة خصوصية المستخدمين؟", a: "تتبع سياسة صارمة؛ فالمستفهم الذكر لا يظهر استفهامه إلا للمفهمين الذكور، والعكس صحيح للإناث. كما أننا نراجع يدوياً كافة الصور الشخصية ونصوص الاستفهامات قبل نشرها لضمان بيئة آمنة." },
    { q: "هل يمكنني استخدام حسابي كمستفهم ومفهم في نفس الوقت؟", a: "نعم، بضغطة زر واحدة يمكنك التحول من واجهة المستفهم لطلب المساعدة، إلى واجهة المفهم لتقديم عروضك ومساعدة الآخرين دون الحاجة لإنشاء حسابين." },
    { q: "ما هي الموضوعات الممنوع الاستفهام عنها؟", a: "يمنع منعاً باتاً التطرق للسياسة، الفتاوى الدينية، الاستشارات الطبية أو القانونية التي يترتب عليها علاج أو إجراء، وكل ما يخالف الشريعة الإسلامية أو القوانين العامة." },
    { q: "ما هو الإجراء المتبع في حال حدوث خلاف أثناء الجلسة؟", a: "تعتمد المنصة على تسجيل الجلسة كمرجع أساسي (وهو تسجيل مؤقت يحذف نهائياً في حالة عدم وجود شكوى أو خلاف). في حال وجود شكوى، يقوم فريق الدعم الفني بمراجعة التسجيل والتحكيم بين الطرفين بناءً على محتوى الشرح." }
  ],
  student: [
    { q: "كيف أطلب 'استفهاماً' جديداً؟", a: "من حسابك كمستفهم, اضغط على 'أضف استفهام', اكتب تفاصيل الجزئية التي لا تفهمها, حدد السعر الذي تراه مناسباً (بحد أدنى 50 جنيه), ثم انتظر مراجعة الإدارة ونشره للمفهمين." },
    { q: "هل هناك حد أقصى لعدد الاستفهامات؟", a: "في الفترة التجريبية, يحق لك استفهام واحد يومياً وبحد أقصى 5 أسبوعياً. كما يمكنك طلب استفهام واحد فقط قبل توثيق هويتك." },
    { q: "كيف أختار أفضل مفهم من بين المتقدمين؟", a: "يمكنك تصفح الملف الشخصي لكل منهم, والاطلاع على تقييمات المستفهمين السابقين له (إن وجد), ومراجعة معرض أعماله للتأكد من خبرته في موضوعك." },
    { q: "ماذا أفعل إذا لم أفهم الشرح أثناء الجلسة؟", a: "عند إنهاء الجلسة, سيظهر لك سؤال 'هل حققت هدفك من الاستفهام'. إذا اخترت 'لا', سيمكنك تقديم شكوى رسمية لمراجعة الجلسة واسترداد أموالك إذا ثبت تقصير المفهم." },
    { q: "هل يمكنني التواصل مع المفهم خارج المنصة؟", a: "يمنع تماماً تبادل أرقام الهواتف أو روابط التواصل الخارجي. أي تواصل خارج المنصة يلغي حقك في الضمان ويعرض حسابك للإغلاق." },
    { q: "ما هي طرق الدفع المتاحة؟", a: "توفر المنصة وسائل دفع آمنة تشمل البطاقات الائتمانية والمحافظ الإلكترونية, ويبقى المبلغ معلقاً لدى المنصة حتى تؤكد فهمك للمعلومة." },
    { q: "هل الجلسة تكون مسجلة دائماً؟", a: "نعم الجلسة تسجل لضمان جودة الخدمة ولحماية حقك في حال أردت تقديم شكوى أو مراجعة المعلومة لاحقاً." },
    { q: "ما هو أقل سعر يمكنني وضعه للاستفهام؟", a: "الآن وحتى انتهاء الفترة المجانية سعر الاستفهام هو صفر, أما بعد انتهاء الفترة المجانية فالحد الأدنى هو 50 جنيهاً مصرياً أو ما يعادلها, ويمكنك زيادة المبلغ حسب صعوبة الموضوع لجذب مفهمين أكثر كفاءة." },
    { q: "هل يظهر استفهامي للجميع فور كتابته؟", a: "لا, يخضع الاستفهام للمراجعة من قبل فريقنا للتأكد من عدم مخالفته للشروط, ثم يظهر للمفهمين المناسبين." }
  ],
  teacher: [
    { q: "كيف أبدأ بتقديم عروض تفهيم؟", a: "يجب عليك أولاً إكمال ملفك الشخصي وتوثيق هويتك. بعد موافقة الإدارة، يمكنك البدء في تقديم العروض." },
    { q: "ما هي عمولة منصة فهمت؟", a: "تقتطع المنصة عمولة قدرها 20% من قيمة كل استفهام مقابل توفير التقنية والوساطة، ويحصل المفهم على 80% من المبلغ." },
    { q: "ما هو معرض الأعمال وكيف أستفيد منه؟", a: "معرض أعمالك هو واجهتك الاحترافية ومساحتك التسويقية الأولى على المنصة؛ فهو النافذة التي يطل منها المستفهم على أسلوبك في الشرح قبل قبول عرضك. احرص على إضافة نماذج شرح مميزة." },
    { q: "متى يمكنني سحب أرباحي؟", a: "بعد انتهاء الجلسة وتأكيد المستفهم لتحقق هدف الاستفهام، ينتقل الرصيد إلى حسابك مباشرة ويمكنك السحب عبر أي وسيلة سحب متاحة في فهمت." },
    { q: "ماذا يحدث إذا قدم المستفهم شكوى كيدية؟", a: "لا داعي للقلق فريقنا يراجع تسجيل الجلسة بالكامل. إذا ثبت تمكنك من تحقيق هدف الاستفهام، سيتم رفض الشكوى وتحويل المبلغ لحسابك فوراً." },
    { q: "هل يمكنني الاعتراف بالخطأ إذا لم أستطع إيصال المعلومة؟", a: "نعم، توفر منصة فهمت خيار 'الاعتراف بالخطأ' في حال نشوب نزاع، وهذا يخفف من العقوبة التي تطبق على حسابك." },
    { q: "كيف أحافظ على تقييم مرتفع؟", a: "يمكنك المحافظة على تقييم مرتفع بعدم التقدم بعروض تفهيم إلا بعد قراءة تفاصيل الاستفهام جيداً، التأكد من قدرتك على تحقيق هدف الاستفهام، الالتزام بالموعد، واستخدام أسلوب شرح مبسط." },
    { q: "هل يحق لي رفض تقديم شرح لموضوع معين؟", a: "بالطبع، أنت تختار الاستفهامات التي تناسب خبرتك وتتقدم لها بعرض وأنت غير ملزم بشرح أي شيء يزيد عن هدف الاستفهام الذي قدمت عرضك عليه." },
    { q: "ماذا لو انقطع الإنترنت لدي أثناء الجلسة؟", a: "يجب عليك محاولة العودة فوراً. إذا تكرر الأمر، قد يؤدي ذلك لفتح شكوى من المستفهم وضياع قيمة الجلسة عليك." },
    { q: "هل يمكنني تعديل عرضي بعد تقديمه؟", a: "لا يمكنك تعديل قيمة العرض أو تفاصيله بعد نشره، لذلك احرص جيداً على الدقة في كتابة العرض والسعر قبل النشر." },
    { q: "لماذا تم رفض صورة ملفي الشخصي أو نبذتي التعريفية؟", a: "تخضع كل البيانات للمراجعة البشرية. قد يتم الرفض إذا كانت الصورة غير لائقة، أو النبذة تحتوي على وسائل تواصل خارجية." }
  ]
};

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "technical", message: "" });

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "supportTickets"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: tickets } = useCollection(ticketsQuery);

  const handleCreateTicket = async () => {
    if (!firestore || !user || !newTicket.subject || !newTicket.message) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }
    try {
      await addDoc(collection(firestore, "supportTickets"), {
        userId: user.uid,
        userName: user.displayName || "مستخدم",
        subject: newTicket.subject,
        category: newTicket.category,
        status: "open",
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      });
      toast({ title: "تم إرسال التذكرة بنجاح" });
      setNewTicket({ subject: "", category: "technical", message: "" });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الإرسال" });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-16 mb-24 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-zinc-900">مركز المساعدة والأسئلة</h1>
          <p className="text-muted-foreground text-lg font-bold">كل ما تحتاج معرفته حول تجربة التعلم في فهمت.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl"><Plus className="ml-2"/> تذكرة دعم جديدة</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] text-right" dir="rtl">
            <DialogHeader><DialogTitle className="text-right text-3xl font-black">فتح تذكرة دعم</DialogTitle></DialogHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label className="font-black">الموضوع</Label>
                <Input value={newTicket.subject} onChange={(e)=>setNewTicket({...newTicket, subject: e.target.value})} className="h-14 rounded-xl border-2" placeholder="ما هي مشكلتك باختصار؟" />
              </div>
              <div className="space-y-2">
                <Label className="font-black">التفاصيل</Label>
                <Textarea value={newTicket.message} onChange={(e)=>setNewTicket({...newTicket, message: e.target.value})} className="h-32 rounded-xl border-2" placeholder="اشرح لنا المزيد..." />
              </div>
            </div>
            <DialogFooter><Button onClick={handleCreateTicket} className="w-full h-16 rounded-2xl font-black text-lg">إرسال التذكرة الآن</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section className="space-y-12">
        <div className="space-y-8">
          <h3 className="text-3xl font-black flex items-center gap-3"><HelpCircle className="text-primary"/> أولاً: أسئلة عامة</h3>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQS_DATA.general.map((faq, i) => (
              <AccordionItem key={i} value={`gen-${i}`} className="border-2 rounded-[2rem] bg-white px-6 overflow-hidden">
                <AccordionTrigger className="text-xl font-black text-zinc-800 hover:no-underline py-6 text-right">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-lg font-bold text-zinc-500 leading-relaxed pb-6 border-t pt-4 text-right">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="space-y-8">
          <h3 className="text-3xl font-black flex items-center gap-3"><User className="text-primary"/> ثانياً: أسئلة المستفهم</h3>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQS_DATA.student.map((faq, i) => (
              <AccordionItem key={i} value={`stu-${i}`} className="border-2 rounded-[2rem] bg-white px-6 overflow-hidden">
                <AccordionTrigger className="text-xl font-black text-zinc-800 hover:no-underline py-6 text-right">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-lg font-bold text-zinc-500 leading-relaxed pb-6 border-t pt-4 text-right">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="space-y-8">
          <h3 className="text-3xl font-black flex items-center gap-3"><GraduationCap className="text-primary"/> ثالثاً: أسئلة المفهم</h3>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQS_DATA.teacher.map((faq, i) => (
              <AccordionItem key={i} value={`tea-${i}`} className="border-2 rounded-[2rem] bg-white px-6 overflow-hidden">
                <AccordionTrigger className="text-xl font-black text-zinc-800 hover:no-underline py-6 text-right">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-lg font-bold text-zinc-500 leading-relaxed pb-6 border-t pt-4 text-right">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="space-y-8 pt-10 border-t">
        <h3 className="text-3xl font-black flex items-center gap-3"><History className="text-primary"/> تذاكرك وطلباتك السابقة</h3>
        <div className="grid gap-6">
          {tickets?.map(t => (
            <Card key={t.id} className="rounded-3xl border-2 p-6 flex flex-col md:flex-row justify-between items-center gap-6 bg-white hover:border-primary/20 transition-all">
              <div className="text-right space-y-1">
                <h4 className="text-xl font-black">{t.subject}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Hash size={12}/> {t.id.slice(0,8)} | {new Date(t.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
              <Badge className={t.status === 'open' ? 'bg-orange-100 text-orange-600 px-4 py-1 rounded-xl' : 'bg-green-100 text-green-600 px-4 py-1 rounded-xl'}>
                {t.status === 'open' ? 'بانتظار الرد' : 'تم الرد'}
              </Badge>
            </Card>
          ))}
          {(!tickets || tickets.length === 0) && (
            <div className="py-20 text-center border-4 border-dashed rounded-[3rem] opacity-30 font-black text-2xl">لا توجد تذاكر دعم سابقة.</div>
          )}
        </div>
      </section>
    </div>
  );
}
