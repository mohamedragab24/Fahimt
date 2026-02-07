
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Clock, User, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function AdminSupport() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "supportTickets"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: tickets, isLoading } = useCollection(ticketsQuery);

  const filteredTickets = tickets?.filter(t => 
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReply = async () => {
    if (!firestore || !selectedTicket || !replyMessage.trim()) return;

    try {
      const ticketRef = doc(firestore, "supportTickets", selectedTicket.id);
      await updateDoc(ticketRef, {
        status: "replied",
        lastUpdate: new Date().toISOString(),
        adminReply: replyMessage // نكتفي بحقل واحد للنموذج الأولي
      });

      setReplyMessage("");
      setSelectedTicket(null);
      toast({ title: "تم إرسال الرد", description: "تم تحديث حالة التذكرة وإرسال الرد للمستخدم." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الرد." });
    }
  };

  const closeTicket = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "supportTickets", id), { status: "closed" });
      toast({ title: "تم إغلاق التذكرة", description: "تم إغلاق التذكرة بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إغلاق التذكرة." });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 border-blue-500 pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">إدارة تذاكر الدعم</h1>
          <p className="text-muted-foreground text-lg">الرد على استفسارات وحل مشاكل مستخدمي "فهمني".</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالموضوع أو اسم المستخدم..." 
            className="h-14 pr-12 rounded-2xl shadow-sm border-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black">الموضوع</TableHead>
              <TableHead className="text-right font-black">المستخدم</TableHead>
              <TableHead className="text-right font-black">التصنيف</TableHead>
              <TableHead className="text-right font-black">الحالة</TableHead>
              <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse font-bold">جاري تحميل التذاكر...</TableCell></TableRow>
            ) : filteredTickets?.map((ticket) => (
              <TableRow key={ticket.id} className="h-24 hover:bg-blue-50/30 transition-colors">
                <TableCell className="px-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{ticket.subject}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(ticket.createdAt).toLocaleString('ar-EG')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{ticket.userName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-bold">
                    {ticket.category === 'finance' ? 'مالي' : ticket.category === 'technical' ? 'تقني' : 'أخرى'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`px-4 py-1.5 rounded-xl font-black ${
                    ticket.status === 'open' ? 'bg-orange-100 text-orange-600' : 
                    ticket.status === 'replied' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {ticket.status === 'open' ? 'جديدة' : ticket.status === 'replied' ? 'تم الرد' : 'مغلقة'}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 text-left">
                  <div className="flex items-center justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTicket(ticket)}
                      className="rounded-xl h-10 border-2 font-bold"
                    >
                      <MessageCircle className="ml-2 h-4 w-4" /> عرض والرد
                    </Button>
                    {ticket.status !== 'closed' && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => closeTicket(ticket.id)}
                        className="rounded-xl h-10 w-10 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black mb-2">تفاصيل التذكرة</DialogTitle>
            <DialogDescription className="text-right">مراجعة شكوى المستخدم والرد عليها.</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="py-6 space-y-6">
              <div className="p-6 bg-muted/20 rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-xl font-black">{selectedTicket.subject}</h4>
                  <Badge variant="secondary">{selectedTicket.category}</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed italic border-r-4 pr-4 border-primary">{selectedTicket.message}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock size={12} /> أرسلت في: {new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>

              {selectedTicket.adminReply && (
                <div className="p-6 bg-blue-50 rounded-3xl space-y-2 border-r-4 border-blue-500">
                  <h5 className="font-black text-blue-700">رد الإدارة السابق:</h5>
                  <p className="text-blue-900 text-sm">{selectedTicket.adminReply}</p>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-lg font-bold">كتابة رد جديد</Label>
                <Textarea 
                  placeholder="اكتب ردك هنا..." 
                  className="h-40 rounded-2xl p-4 border-2" 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleReply} className="w-full h-14 text-xl font-black rounded-xl shadow-lg">
              إرسال الرد وتحديث الحالة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
