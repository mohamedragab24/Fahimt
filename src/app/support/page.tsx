
"use client";

import { useState, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, addDoc, doc, updateDoc, orderBy } from "firebase/firestore";
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
  Plus, 
  Send, 
  Hash, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const FAQS = [
  { q: "كيف أبدأ كـ 'مستفهم'؟", a: "ببساطة اضغط على 'طرح استفهام' في الصفحة الرئيسية، صف معلومتك وحدد سعرك، وسيتواصل معك المفهمون المناسبون." },
  { q: "كيف يتم توثيق حساب المفهم؟", a: "يجب عليك رفع صورة البطاقة الشخصية وصورة شخصية واضحة من ملفك الشخصي، وسيقوم فريق فهمت بمراجعتها وتوثيق حسابك بشارة زرقاء." },
  { q: "هل أموالي في أمان؟", a: "نعم، فهمت وسيط ضامن؛ لا يتم تحويل المبلغ للمفهم إلا بعد تأكيدك بأنك فهمت المعلومة المطلوبة تماماً." },
  { q: "ما هي طرق سحب الأرباح؟", a: "يمكنك سحب أرباحك عبر المحافظ الإلكترونية (فودافون كاش وغيرها)، إنستا باي (InstaPay)، أو التحويل البنكي المباشر." }
];

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "technical", message: "" });

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "supportTickets"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: tickets } = useCollection(ticketsQuery);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-16 mb-24 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-headline">مركز الدعم والأسئلة</h1>
          <p className="text-muted-foreground text-lg font-bold">نحن هنا لمساعدتك في الحصول على أفضل تجربة مع "فهمت".</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl"><Plus className="ml-2"/> تذكرة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] text-right" dir="rtl">
            <DialogHeader><DialogTitle className="text-right text-3xl font-black">فتح تذكرة دعم</DialogTitle></DialogHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2"><Label className="font-black">الموضوع</Label><Input value={newTicket.subject} onChange={(e)=>setNewTicket({...newTicket, subject: e.target.value})} className="h-14 rounded-xl border-2" /></div>
              <div className="space-y-2"><Label className="font-black">التفاصيل</Label><Textarea value={newTicket.message} onChange={(e)=>setNewTicket({...newTicket, message: e.target.value})} className="h-32 rounded-xl border-2" /></div>
            </div>
            <DialogFooter><Button onClick={() => setIsDialogOpen(false)} className="w-full h-16 rounded-2xl font-black">إرسال التذكرة</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* قسم الأسئلة الشائعة */}
      <section className="space-y-8">
        <h3 className="text-3xl font-black flex items-center gap-3"><HelpCircle className="text-primary"/> الأسئلة الشائعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQS.map((faq, i) => (
            <Card key={i} className="rounded-3xl border-2 bg-white hover:border-primary/20 transition-all p-8 space-y-4">
              <h4 className="text-xl font-black text-zinc-800">{faq.q}</h4>
              <p className="text-zinc-500 font-bold leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* تذاكر الدعم السابقة */}
      <section className="space-y-8">
        <h3 className="text-3xl font-black flex items-center gap-3"><History className="text-primary"/> تذاكرك السابقة</h3>
        <div className="grid gap-6">
          {tickets?.map(t => (
            <Card key={t.id} className="rounded-3xl border-2 p-6 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
              <div className="text-right space-y-1">
                <h4 className="text-xl font-black">{t.subject}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Hash size={12}/> {t.id.slice(0,8)} | {new Date(t.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
              <Badge className={t.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                {t.status === 'open' ? 'بانتظار الرد' : 'تم الرد'}
              </Badge>
            </Card>
          ))}
          {(!tickets || tickets.length === 0) && (
            <div className="py-20 text-center border-4 border-dashed rounded-[3rem] opacity-30 font-black text-2xl">لا توجد تذاكر حالياً.</div>
          )}
        </div>
      </section>
    </div>
  );
}
