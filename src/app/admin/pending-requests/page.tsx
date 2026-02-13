
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  HelpCircle,
  BadgeCent,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminPendingRequests() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedIstifham, setSelectedIstifham] = useState<any>(null);

  const istifhamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "==", "pending_approval"), 
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: istifhams, isLoading } = useCollection(istifhamsQuery);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(firestore!, "istifhams", id), { status: "active" });
      toast({ title: "تم النشر", description: "الاستفهام متاح الآن للمفهمين." });
      setSelectedIstifham(null);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في النشر" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(firestore!, "istifhams", id), { status: "canceled" });
      toast({ variant: "destructive", title: "تم الرفض", description: "تم إلغاء الطلب." });
      setSelectedIstifham(null);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-orange-500 pr-6">
        <h1 className="text-4xl font-black font-headline">الطلبات قيد المراجعة</h1>
        <p className="text-muted-foreground text-lg">مراجعة محتوى الاستفهامات والميزانية قبل النشر لضمان الجودة.</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-bold">جاري تحميل الطلبات...</div>
        ) : istifhams?.map((ist) => (
          <Card key={ist.id} className="rounded-3xl border-2 p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 bg-white group">
            <div className="space-y-2 text-right w-full">
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-100 text-orange-600 border-none font-bold">بانتظار الموافقة</Badge>
                <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                  <Clock size={12}/> {new Date(ist.createdAt).toLocaleString('ar-EG')}
                </span>
              </div>
              <h4 className="text-2xl font-black text-zinc-800 group-hover:text-primary transition-colors">{ist.title}</h4>
              <p className="font-bold text-muted-foreground">بواسطة: <span className="text-zinc-900">{ist.mustafhemName}</span> | الميزانية: <span className="text-primary">{ist.amount} ج.م</span></p>
            </div>
            <div className="flex gap-3 w-full md:w-auto shrink-0">
              <Button variant="outline" onClick={() => setSelectedIstifham(ist)} className="h-14 px-8 font-black rounded-2xl border-2">
                <Eye className="ml-2 h-5 w-5" /> مراجعة التفاصيل
              </Button>
              <Button onClick={() => handleApprove(ist.id)} className="bg-green-600 hover:bg-green-700 h-14 px-8 font-black rounded-2xl shadow-lg">
                <CheckCircle2 className="ml-2 h-5 w-5" /> موافقة ونشر
              </Button>
            </div>
          </Card>
        ))}
        {!isLoading && istifhams?.length === 0 && (
          <div className="py-20 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد طلبات جديدة للمراجعة حالياً.</div>
        )}
      </div>

      <Dialog open={!!selectedIstifham} onOpenChange={() => setSelectedIstifham(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3"><HelpCircle className="text-primary h-8 w-8" /> تفاصيل الطلب</DialogTitle>
            <DialogDescription className="text-right text-lg">مراجعة كاملة لمحتوى الاستفهام قبل النشر.</DialogDescription>
          </DialogHeader>
          {selectedIstifham && (
            <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto px-2">
              <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4">
                <h4 className="text-2xl font-black text-primary leading-tight">{selectedIstifham.title}</h4>
                <div className="flex items-start gap-2">
                  <FileText className="text-muted-foreground shrink-0 mt-1" size={18} />
                  <p className="text-zinc-700 leading-relaxed font-medium">{selectedIstifham.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/10 rounded-2xl border flex items-center gap-4">
                  <BadgeCent className="text-primary" />
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground block uppercase">الميزانية</span>
                    <span className="font-bold">{selectedIstifham.amount} ج.م</span>
                  </div>
                </div>
                <div className="p-4 bg-muted/10 rounded-2xl border flex items-center gap-4">
                  <Calendar className="text-primary" />
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground block uppercase">الموعد المقترح</span>
                    <span className="font-bold">{new Date(selectedIstifham.meetingTime).toLocaleString('ar-EG')}</span>
                  </div>
                </div>
                <div className="p-4 bg-muted/10 rounded-2xl border flex items-center gap-4">
                  <User className="text-primary" />
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground block uppercase">المستفهم</span>
                    <span className="font-bold">{selectedIstifham.mustafhemName}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button onClick={() => handleApprove(selectedIstifham.id)} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xl">موافقة ونشر</Button>
                <Button onClick={() => handleReject(selectedIstifham.id)} variant="destructive" className="h-16 rounded-2xl font-black text-xl">رفض الطلب</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
