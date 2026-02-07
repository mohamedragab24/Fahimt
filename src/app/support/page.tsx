
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, HelpCircle, History, Clock, CheckCircle2, AlertCircle, Bot, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { askPlatformAssistant } from "@/ai/flows/platform-assistant-flow";

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "technical", message: "" });
  
  // AI Assistant States
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "supportTickets"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: tickets, isLoading } = useCollection(ticketsQuery);

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
      toast({ title: "تم إرسال التذكرة", description: "سيرد عليك فريق الدعم في أقرب وقت ممكن." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال التذكرة." });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 border-r-8 border-primary pr-6">
          <h1 className="text-4xl font-black font-headline">الدعم الفني</h1>
          <p className="text-muted-foreground text-lg">نحن هنا لمساعدتك في أي مشكلة تواجهك في المنصة.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-all">
              <MessageCircle className="ml-3 h-6 w-6" /> تذكرة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-3xl font-black mb-2">كيف يمكننا مساعدتك؟</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">نوع المشكلة</Label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger className="h-14 rounded-xl text-lg">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">مشكلة مالية (شحن/سحب)</SelectItem>
                    <SelectItem value="technical">مشكلة تقنية (البث/الحساب)</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-lg font-bold">الموضوع</Label>
                <Input 
                  placeholder="عنوان مختصر للمشكلة" 
                  className="h-14 rounded-xl text-lg" 
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-lg font-bold">تفاصيل الرسالة</Label>
                <Textarea 
                  placeholder="اشرح لنا المشكلة بالتفصيل..." 
                  className="h-40 rounded-xl text-lg p-4" 
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTicket} className="w-full h-14 text-xl font-black rounded-xl">
                إرسال التذكرة الآن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Assistant Section */}
      <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 overflow-hidden">
        <CardHeader className="bg-primary p-8 text-white">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <Bot className="h-8 w-8" /> اسأل مساعد "فهمني" الذكي
          </CardTitle>
          <CardDescription className="text-white/80 text-lg">احصل على إجابات فورية حول كيفية استخدام المنصة والسياسات المالية.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex gap-4">
            <Input 
              placeholder="مثال: كيف يمكنني سحب أرباحي؟" 
              className="h-14 rounded-xl text-lg bg-white shadow-sm border-2 focus:border-primary"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
            />
            <Button onClick={handleAiAsk} disabled={isAiLoading} className="h-14 px-8 rounded-xl bg-primary text-white font-bold">
              {isAiLoading ? <Sparkles className="animate-spin" /> : "اسأل"}
            </Button>
          </div>
          {aiResponse && (
            <div className="p-6 bg-white rounded-3xl border-2 border-dashed border-primary/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-3 mb-4">
                <Bot className="text-primary h-6 w-6" />
                <span className="font-black text-primary">رد المساعد الذكي:</span>
              </div>
              <p className="text-lg leading-relaxed font-medium text-zinc-800">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <History className="text-primary" /> تذاكرك السابقة المفتوحة
        </h3>
        
        {isLoading ? (
          <div className="text-center py-20 animate-pulse font-bold">جاري تحميل التذاكر...</div>
        ) : tickets && tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="shadow-lg border-2 hover:border-primary/20 transition-all rounded-[2rem] overflow-hidden bg-white group">
                <CardHeader className="bg-muted/10 p-6 flex flex-row justify-between items-center">
                  <Badge className={`px-4 py-1.5 rounded-xl font-black ${
                    ticket.status === 'open' ? 'bg-orange-100 text-orange-600' : 
                    ticket.status === 'replied' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {ticket.status === 'open' ? 'بانتظار الرد' : ticket.status === 'replied' ? 'تم الرد' : 'مغلقة'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-bold">{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</span>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <h4 className="text-xl font-black group-hover:text-primary transition-colors">{ticket.subject}</h4>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{ticket.message}</p>
                  <div className="pt-4 border-t border-dashed flex items-center justify-between text-xs text-muted-foreground font-bold">
                    <span className="flex items-center gap-2">
                      {ticket.category === 'finance' ? <AlertCircle size={14} className="text-orange-500" /> : <HelpCircle size={14} className="text-blue-500" />}
                      {ticket.category === 'finance' ? 'مالي' : 'تقني'}
                    </span>
                    <span className="flex items-center gap-1"><Clock size={12} /> تحديث: {new Date(ticket.lastUpdate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed text-muted-foreground font-bold text-xl opacity-30">
            <HelpCircle size={80} className="mx-auto mb-6" />
            لا توجد تذاكر دعم سابقة.
          </div>
        )}
      </div>
    </div>
  );
}
