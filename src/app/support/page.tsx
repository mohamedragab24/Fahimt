
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
  Bot, 
  Sparkles, 
  Info,
  User,
  GraduationCap,
  Plus,
  Send,
  Clock,
  ChevronRight,
  Hash,
  Paperclip,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { askPlatformAssistant } from "@/ai/flows/platform-assistant-flow";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "technical", message: "" });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "supportTickets"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: tickets } = useCollection(ticketsQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTicket) return null;
    return query(collection(firestore, "supportTickets", selectedTicket.id, "messages"), orderBy("createdAt", "asc"));
  }, [firestore, selectedTicket]);

  const { data: messages } = useCollection(messagesQuery);

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
    if (!firestore || !user || !newTicket.subject || !newTicket.message) return;
    try {
      const ticketRef = await addDoc(collection(firestore, "supportTickets"), {
        userId: user.uid,
        userName: user.displayName || "مستخدم فهمني",
        subject: newTicket.subject,
        category: newTicket.category,
        status: "open",
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
      });

      await addDoc(collection(firestore, "supportTickets", ticketRef.id, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || "مستخدم فهمني",
        text: newTicket.message,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      setNewTicket({ subject: "", category: "technical", message: "" });
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء التذكرة", description: "يمكنك الآن متابعة الدردشة مع الدعم." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  const handleSendMessage = async (attachmentBase64?: string) => {
    if (!chatMessage.trim() && !attachmentBase64) return;
    if (!firestore || !user || !selectedTicket || selectedTicket.status === 'closed') return;
    try {
      await addDoc(collection(firestore, "supportTickets", selectedTicket.id, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || "مستخدم",
        text: chatMessage,
        attachmentUrl: attachmentBase64 || null,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(firestore, "supportTickets", selectedTicket.id), {
        lastUpdate: new Date().toISOString(),
        status: "open"
      });
      setChatMessage("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الإرسال" });
    }
  };

  const closeTicket = async () => {
    if (!firestore || !selectedTicket) return;
    try {
      await updateDoc(doc(firestore, "supportTickets", selectedTicket.id), { status: 'closed' });
      toast({ title: "تم إغلاق التذكرة بنجاح" });
      setSelectedTicket(null);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSendMessage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-16 mb-20" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 border-r-8 border-primary pr-6">
          <h1 className="text-4xl md:text-5xl font-black font-headline">مركز المساعدة</h1>
          <p className="text-muted-foreground text-lg">تواصل معنا، نحن هنا لخدمتك.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl">
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
                <Label className="font-bold">نوع المشكلة</Label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">مشكلة مالية</SelectItem>
                    <SelectItem value="technical">مشكلة تقنية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-bold">الموضوع</Label>
                <Input placeholder="عنوان مختصر للمشكلة" className="h-14 rounded-xl border-2" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-bold">التفاصيل</Label>
                <Textarea placeholder="اشرح المشكلة بالتفصيل..." className="h-40 rounded-xl p-4 border-2" value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTicket} className="w-full h-16 text-xl font-black rounded-2xl shadow-lg">بدء المحادثة مع الدعم</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
            <Input placeholder="مثال: كيف يتم سحب الأرباح؟" className="h-16 rounded-2xl text-xl bg-white shadow-inner border-2 text-right" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} />
            <Button onClick={handleAiAsk} disabled={isAiLoading} className="h-16 px-10 rounded-2xl bg-primary text-white text-xl font-black">
              {isAiLoading ? <Sparkles className="animate-spin h-6 w-6" /> : "اسأل"}
            </Button>
          </div>
          {aiResponse && (
            <div className="p-8 bg-white rounded-[2rem] border-2 border-dashed border-primary/30 animate-in fade-in">
              <p className="text-xl leading-relaxed font-bold text-zinc-800 text-right">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-8">
        <h3 className="text-3xl font-black flex items-center justify-end gap-3">تذاكرك ونظام الدردشة <History className="text-primary" /></h3>
        {selectedTicket ? (
          <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
            <div className="p-6 bg-muted/30 border-b flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setSelectedTicket(null)}><ChevronRight className="ml-2" /> العودة</Button>
                <div className="text-right">
                  <h4 className="font-black text-lg">{selectedTicket.subject}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Hash size={12}/> {selectedTicket.id.slice(0,8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedTicket.status !== 'closed' && (
                  <Button variant="outline" size="sm" onClick={closeTicket} className="rounded-xl font-bold border-green-500 text-green-600 hover:bg-green-50">
                    <CheckCircle2 size={16} className="ml-1" /> تم الحل
                  </Button>
                )}
                <Badge className={selectedTicket.status === 'open' ? 'bg-orange-100 text-orange-600' : selectedTicket.status === 'suspended' ? 'bg-zinc-100 text-zinc-600' : 'bg-green-100 text-green-600'}>
                  {selectedTicket.status === 'open' ? 'بانتظار الرد' : selectedTicket.status === 'suspended' ? 'معلقة' : 'تم الرد/مغلقة'}
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[400px] p-6 bg-zinc-50/50">
              <div className="space-y-4">
                {messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.isAdmin ? 'bg-white border text-zinc-800' : 'bg-primary text-white'}`}>
                      {msg.text && <p className="font-bold text-sm">{msg.text}</p>}
                      {msg.attachmentUrl && (
                        <img src={msg.attachmentUrl} className="mt-2 rounded-xl max-w-full h-auto cursor-pointer border-4 border-white/10" alt="Attachment" />
                      )}
                      <span className="text-[10px] opacity-50 block mt-1">{new Date(msg.createdAt).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-6 border-t bg-white">
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-14 w-14 rounded-xl" disabled={selectedTicket.status === 'closed'}>
                  <Paperclip size={24} />
                </Button>
                <Input placeholder={selectedTicket.status === 'closed' ? "هذه التذكرة مغلقة" : "اكتب ردك هنا..."} className="h-14 rounded-xl border-2" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} disabled={selectedTicket.status === 'closed'} />
                <Button onClick={() => handleSendMessage()} className="h-14 px-6 rounded-xl" disabled={selectedTicket.status === 'closed'}><Send size={20}/></Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tickets?.map((t) => (
              <Card key={t.id} className="shadow-lg border-2 rounded-[2rem] overflow-hidden bg-white hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedTicket(t)}>
                <CardHeader className="bg-muted/10 p-6 flex flex-row justify-between items-center">
                  <Badge className={`px-4 py-1 rounded-xl font-bold ${t.status === 'open' ? 'bg-orange-100 text-orange-600' : t.status === 'suspended' ? 'bg-zinc-100 text-zinc-600' : 'bg-green-100 text-green-600'}`}>
                    {t.status === 'open' ? 'بانتظار الرد' : t.status === 'suspended' ? 'معلقة' : 'تم الرد'}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Hash size={10}/> {t.id.slice(0, 8)}</span>
                </CardHeader>
                <CardContent className="p-8 space-y-4 text-right">
                  <h4 className="text-xl font-black text-zinc-800">{t.subject}</h4>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
                    <span className="text-primary font-bold">اضغط لمتابعة الدردشة</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!tickets || tickets.length === 0) && (
              <div className="col-span-full py-20 text-center bg-zinc-50 rounded-[3rem] border-4 border-dashed border-zinc-200">
                <p className="font-black text-2xl text-zinc-400">لا توجد تذاكر دعم مفتوحة حالياً.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
