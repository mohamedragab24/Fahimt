
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  HelpCircle, 
  History, 
  Bot, 
  Sparkles, 
  Info,
  User,
  GraduationCap,
  Plus
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { askPlatformAssistant } from "@/ai/flows/platform-assistant-flow";

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "technical", message: "" });
  
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // الأسئلة الشائعة - قسم عام
  const generalFaqs = [
    { q: "ما هي منصة فهمني وما الذي يميزها؟", a: "منصة فهمني هي وسيط تقني يربط بين المستفهم (من يبحث عن معلومة أو شرح سريع) و المفهم (صاحب الخبرة والقدرة على الشرح). ما يميزنا هو التخصص في 'الفهم اللحظي' عبر جلسات مسجلة تضمن حق الطرفين، مع مراعاة الخصوصية التامة بفصل الجنسين في التعامل." },
    { q: "كيف تضمن المنصة خصوصية المستخدمين؟", a: "تتبع المنصة سياسة صارمة؛ فالمستفهم الذكر لا يظهر استفهامه إلا للمفهمين الذكور، والعكس صحيح للإناث. كما أننا نراجع يدوياً كافة الصور الشخصية ونصوص الاستفهامات قبل نشرها لضمان بيئة آمنة." },
    { q: "هل يمكنني استخدام حسابي كمستفهم ومفهم في نفس الوقت؟", a: "نعم، بضغطة زر واحدة يمكنك التحول من واجهة المستفهم لطلب المساعدة إلى واجهة المفهم لتقديم عروضك ومساعدة الآخرين، دون الحاجة لإنشاء حسابين." },
    { q: "ما هي الموضوعات الممنوع الاستفهام عنها؟", a: "يمنع منعاً باتاً التطرق للسياسة، الفتاوى الدينية، الاستشارات الطبية أو القانونية التي يترتب عليها علاج أو إجراء، وكل ما يخالف الشريعة الإسلامية أو القوانين العامة." },
    { q: "ما هو الإجراء المتبع في حال حدوث خلاف أثناء الجلسة؟", a: "تعتمد المنصة على تسجيل الجلسة كمرجع أساسي. في حال وجود شكوى، يقوم فريق الدعم الفني بمراجعة التسجيل والتحكيم بين الطرفين بناءً على محتوى الشرح." }
  ];

  // الأسئلة الشائعة - المستفهم
  const studentFaqs = [
    { q: "كيف أطلب 'استفهاماً' جديداً؟", a: "من حسابك كمستفهم، اضغط على 'أضف استفهام'، اكتب تفاصيل الجزئية التي لا تفهمها، حدد السعر الذي تراه مناسباً (بحد أدنى 50 جنيه)، ثم انتظر مراجعة الإدارة ونشره للمفهمين." },
    { q: "هل هناك حد أقصى لعدد الاستفهامات؟", a: "في الفترة التجريبية، يحق لك استفهام واحد يومياً وبحد أقصى 5 أسبوعياً. كما يمكنك طلب استفهام واحد فقط قبل توثيق هويتك." },
    { q: "كيف أختار أفضل مفهم من بين المتقدمين؟", a: "يمكنك تصفح الملف الشخصي لكل مفهم، والاطلاع على تقييمات المستفهمين السابقين له، ومراجعة معرض أعماله للتأكد من خبرته في موضوعك." },
    { q: "ماذا أفعل إذا لم أفهم الشرح أثناء الجلسة؟", a: "عند إنهاء الجلسة، سيظهر لك سؤال 'هل حققت هدفك من الاستفهام'. إذا اخترت 'لا'، سيمكنك تقديم شكوى رسمية لمراجعة الجلسة واسترداد أموالك إذا ثبت تقصير المفهم." },
    { q: "هل يمكنني التواصل مع المفهم خارج المنصة؟", a: "يمنع تماماً تبادل أرقام الهواتف أو روابط التواصل الخارجي. أي تواصل خارج المنصة يلغي حقك في الضمان ويعرض حسابك للإغلاق." },
    { q: "ما هي طرق الدفع المتاحة؟", a: "نوفر وسائل دفع آمنة (بطاقات ائتمانية، محافظ إلكترونية)، ويبقى المبلغ معلقاً لدى المنصة حتى تؤكد فهمك للمعلومة." },
    { q: "هل الجلسة تكون مسجلة دائماً؟", a: "نعم، الجلسة تسجل لضمان جودة الخدمة ولحماية حقك في حال أردت تقديم شكوى أو مراجعة المعلومة لاحقاً." },
    { q: "ما هو أقل سعر يمكنني وضعه للاستفهام؟", a: "الآن وحتى انتهاء الفترة المجانية سعر الاستفهام هو صفر، أما بعد انتهاء الفترة المجانية فالحد الأدنى هو 50 جنيهاً مصرياً، ويمكنك زيادة المبلغ لجذب مفهمين أكثر كفاءة." },
    { q: "هل يظهر استفهامي للجميع فور كتابته؟", a: "لا، يخضع الاستفهام للمراجعة من قبل فريقنا للتأكد من عدم مخالفته للشروط ثم يظهر للمفهمين المناسبين." }
  ];

  // الأسئلة الشائعة - المفهم
  const teacherFaqs = [
    { q: "كيف أبدأ بتقديم عروض تفهيم؟", a: "يجب عليك أولاً إكمال ملفك الشخصي وتوثيق هويتك. بعد موافقة الإدارة، يمكنك البدء في تقديم العروض على الاستفهامات المتاحة." },
    { q: "ما هي عمولة منصة فهمني؟", a: "تقتطع المنصة عمولة قدرها 20% من قيمة كل استفهام مقابل توفير التقنية والوساطة، ويحصل المفهم على 80% من المبلغ." },
    { q: "ما هو معرض الأعمال وكيف أستفيد منه؟", a: "معرض أعمالك هو واجهتك الاحترافية؛ فهو النافذة التي يطل منها المستفهم على أسلوبك قبل قبول عرضك. احرص على إضافة نماذج مميزة لمهاراتك." },
    { q: "متى يمكنني سحب أرباحي؟", a: "بعد انتهاء الجلسة وتأكيد المستفهم لتحقق الهدف، ينتقل الرصيد إلى حسابك مباشرة ويمكنك السحب عبر الوسائل المتاحة." },
    { q: "ماذا يحدث إذا قدم المستفهم شكوى كيدية؟", a: "لا داعي للقلق؛ فريقنا يراجع تسجيل الجلسة بالكامل. إذا ثبت تمكنك من تحقيق هدف الاستفهام، سيتم رفض الشكوى وتحويل المبلغ لحسابك فوراً." },
    { q: "هل يمكنني الاعتراف بالخطأ إذا لم أستطع إيصال المعلومة؟", a: "نعم، توفر المنصة خيار 'الاعتراف بالخطأ' في حال نشوب نزاع، وهذا يخفف من العقوبة التي قد تطبق على حسابك." },
    { q: "كيف أحافظ على تقييم مرتفع؟", a: "بالتأكد من قدرتك على الشرح قبل التقديم، الالتزام بالموعد، استخدام أسلوب مبسط، والتأكد المستمر من متابعة المستفهم لك." },
    { q: "هل يحق لي رفض تقديم شرح لموضوع معين؟", a: "بالطبع، أنت تختار الاستفهامات التي تناسب خبرتك فقط، وأنت غير ملزم بشرح أي شيء يزيد عن هدف الاستفهام المحدد." },
    { q: "ماذا لو انقطع الإنترنت لدي أثناء الجلسة؟", a: "يجب محاولة العودة فوراً. التكرار قد يؤدي لفتح شكوى من المستفهم وضياع قيمة الجلسة، لذا تأكد من استقرار اتصالك." },
    { q: "هل يمكنني تعديل عرضي بعد تقديمه؟", a: "لا يمكنك تعديل قيمة العرض أو تفاصيله بعد نشره، لذا احرص على الدقة قبل ضغط زر الإرسال." }
  ];

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "supportTickets"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: rawTickets, isLoading } = useCollection(ticketsQuery);
  const tickets = rawTickets?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const result = await askPlatformAssistant({ query: aiQuery });
      setAiResponse(result.answer);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الاتصال بالمساعد الذكي." });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!firestore || !user || !newTicket.subject || !newTicket.message) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى ملء جميع الحقول المطلوبة." });
      return;
    }

    try {
      await addDoc(collection(firestore, "supportTickets"), {
        userId: user.uid,
        userName: user.displayName || "مستخدم",
        subject: newTicket.subject,
        category: newTicket.category,
        message: newTicket.message,
        status: "open",
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
      });

      setNewTicket({ subject: "", category: "technical", message: "" });
      setIsDialogOpen(false);
      toast({ title: "تم إرسال التذكرة", description: "سيرد فريق الدعم عليك قريباً." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-16 mb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 border-r-8 border-primary pr-6 text-right">
          <h1 className="text-4xl md:text-5xl font-black font-headline text-zinc-900">مركز المساعدة</h1>
          <p className="text-muted-foreground text-lg font-medium">كل ما تحتاجه لفهم كيفية عمل منصة فهمني وضمان حقوقك.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-transform">
              <Plus className="ml-2" /> تذكرة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-[2.5rem]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-3xl font-black">كيف نساعدك؟</DialogTitle>
              <DialogDescription className="text-right font-bold">أخبرنا بمشكلتك وسيقوم فريقنا بحلها في أقرب وقت.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2 text-right">
                <Label className="text-lg font-bold">نوع المشكلة</Label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger className="h-14 rounded-xl text-lg border-2"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">مشكلة مالية</SelectItem>
                    <SelectItem value="technical">مشكلة تقنية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-right">
                <Label className="text-lg font-bold">الموضوع</Label>
                <Input placeholder="عنوان مختصر للمشكلة" className="h-14 rounded-xl text-lg border-2" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
              </div>
              <div className="space-y-2 text-right">
                <Label className="text-lg font-bold">التفاصيل</Label>
                <Textarea placeholder="اشرح المشكلة بالتفصيل..." className="h-40 rounded-xl text-lg p-4 border-2" value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTicket} className="w-full h-16 text-xl font-black rounded-2xl shadow-lg">إرسال التذكرة الآن</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Assistant Section */}
      <Card className="rounded-[3rem] border-2 border-primary/20 bg-primary/5 overflow-hidden shadow-2xl">
        <CardHeader className="bg-primary p-8 text-white text-right">
          <div className="flex items-center justify-end gap-4">
            <div>
              <CardTitle className="text-3xl font-black">مساعد "فهمني" الذكي</CardTitle>
              <CardDescription className="text-white/80 text-lg font-bold">إجابات فورية حول السياسات والعمليات المالية.</CardDescription>
            </div>
            <div className="bg-white/20 p-4 rounded-3xl"><Bot className="h-10 w-10" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex gap-4">
            <Input 
              placeholder="مثال: كيف يتم سحب الأرباح؟" 
              className="h-16 rounded-2xl text-xl bg-white shadow-inner border-2 focus:border-primary text-right" 
              value={aiQuery} 
              onChange={(e) => setAiQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} 
            />
            <Button onClick={handleAiAsk} disabled={isAiLoading} className="h-16 px-10 rounded-2xl bg-primary text-white text-xl font-black shadow-lg">
              {isAiLoading ? <Sparkles className="animate-spin h-6 w-6" /> : "اسأل"}
            </Button>
          </div>
          {aiResponse && (
            <div className="p-8 bg-white rounded-[2rem] border-2 border-dashed border-primary/30 animate-in fade-in slide-in-from-top-4">
              <p className="text-xl leading-relaxed font-bold text-zinc-800 text-right">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="space-y-12">
        <div className="text-center space-y-2">
          <h3 className="text-4xl font-black text-zinc-900">الأسئلة الشائعة</h3>
          <p className="text-muted-foreground text-lg font-bold">اعثر على إجابات سريعة لكل ما يدور في ذهنك.</p>
        </div>

        <div className="grid grid-cols-1 gap-10">
          {/* General FAQs */}
          <section className="space-y-6">
            <div className="flex items-center justify-end gap-3 border-b-4 border-zinc-100 pb-4">
              <h4 className="text-2xl font-black text-zinc-800">أولاً: أسئلة عامة</h4>
              <div className="bg-zinc-100 p-2 rounded-xl text-zinc-600"><Info size={24} /></div>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {generalFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`gen-${i}`} className="border-2 rounded-[1.5rem] px-6 bg-white overflow-hidden shadow-sm hover:border-primary/20 transition-all">
                  <AccordionTrigger className="text-right text-lg font-black py-6 hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-right text-zinc-600 text-lg leading-relaxed font-medium pb-6 pt-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Student FAQs */}
          <section className="space-y-6">
            <div className="flex items-center justify-end gap-3 border-b-4 border-green-100 pb-4">
              <h4 className="text-2xl font-black text-green-800">ثانياً: أسئلة المستفهم</h4>
              <div className="bg-green-100 p-2 rounded-xl text-green-600"><User size={24} /></div>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {studentFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`std-${i}`} className="border-2 rounded-[1.5rem] px-6 bg-white overflow-hidden shadow-sm hover:border-green-500/20 transition-all">
                  <AccordionTrigger className="text-right text-lg font-black py-6 hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-right text-zinc-600 text-lg leading-relaxed font-medium pb-6 pt-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Teacher FAQs */}
          <section className="space-y-6">
            <div className="flex items-center justify-end gap-3 border-b-4 border-accent/20 pb-4">
              <h4 className="text-2xl font-black text-accent">ثالثاً: أسئلة المفهم</h4>
              <div className="bg-accent/10 p-2 rounded-xl text-accent"><GraduationCap size={24} /></div>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {teacherFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`tch-${i}`} className="border-2 rounded-[1.5rem] px-6 bg-white overflow-hidden shadow-sm hover:border-accent/20 transition-all">
                  <AccordionTrigger className="text-right text-lg font-black py-6 hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-right text-zinc-600 text-lg leading-relaxed font-medium pb-6 pt-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </div>

      {/* Previous Tickets */}
      <div className="space-y-8 pt-10 border-t-4 border-zinc-50">
        <h3 className="text-3xl font-black flex items-center justify-end gap-3">تذاكرك السابقة <History className="text-primary" /></h3>
        {isLoading ? (
          <div className="text-center py-20 animate-pulse font-bold">جاري تحميل سجلات الدعم...</div>
        ) : tickets && tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tickets.map((t) => (
              <Card key={t.id} className="shadow-lg border-2 rounded-[2rem] overflow-hidden bg-white hover:shadow-xl transition-all">
                <CardHeader className="bg-muted/10 p-6 flex flex-row justify-between items-center">
                  <Badge className={`px-4 py-1 rounded-xl font-bold ${t.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {t.status === 'open' ? 'بانتظار الرد' : t.status === 'replied' ? 'تم الرد' : 'مغلقة'}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
                </CardHeader>
                <CardContent className="p-8 space-y-4 text-right">
                  <h4 className="text-xl font-black text-zinc-800">{t.subject}</h4>
                  <p className="text-muted-foreground line-clamp-2 text-sm font-medium">{t.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-zinc-50 rounded-[3rem] border-4 border-dashed border-zinc-200">
            <div className="flex flex-col items-center gap-4 opacity-30">
              <MessageCircle size={60} />
              <p className="font-black text-2xl">لا توجد تذاكر سابقة حالياً.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
