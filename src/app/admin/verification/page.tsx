
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, XCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminVerification() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const verQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "verificationRequests"), where("status", "==", "pending"));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(verQuery);

  const handleAction = async (req: any, action: 'approve' | 'reject') => {
    if (!firestore) return;
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      await updateDoc(doc(firestore, "verificationRequests", req.id), { status });
      
      if (action === 'approve') {
        await updateDoc(doc(firestore, "users", req.userId), { isVerified: true });
        toast({ title: "تم التوثيق!", description: "تم منح المستخدم الشارة الزرقاء." });
      } else {
        toast({ title: "تم الرفض", description: "تم رفض طلب التوثيق بنجاح." });
      }

      // إضافة سجل
      await addDoc(collection(firestore, "adminLogs"), {
        action: `${status}_verification`,
        targetUserId: req.userId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تنفيذ العملية" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex justify-between items-center gap-6 border-r-8 border-orange-500 pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">مركز التوثيق</h1>
          <p className="text-muted-foreground text-lg">مراجعة طلبات التوثيق ومنح الشارة الزرقاء للمفهمين.</p>
        </div>
        <Badge className="bg-orange-100 text-orange-600 px-6 py-2 text-lg font-black rounded-2xl">
          {requests?.length || 0} طلب قيد الانتظار
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full text-center py-32 text-2xl font-black animate-pulse">جاري فحص الطلبات...</div>
        ) : requests?.map((req) => (
          <Card key={req.id} className="shadow-xl rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-orange-500/20 transition-all group">
            <CardHeader className="bg-muted/30 p-8 flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={req.profilePictureUrl || `https://picsum.photos/seed/${req.userId}/200/200`} />
                <AvatarFallback>{req.userName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <CardTitle className="text-2xl font-black group-hover:text-orange-500 transition-colors">{req.userName}</CardTitle>
                <p className="text-sm text-muted-foreground font-bold">{req.userEmail}</p>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="p-4 bg-orange-50 rounded-2xl border border-dashed border-orange-200">
                <p className="text-xs text-orange-700 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> يرجى مطابقة الصورة الشخصية مع بيانات البروفايل.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleAction(req, 'approve')}
                  className="bg-green-600 hover:bg-green-700 h-16 rounded-2xl font-black text-lg shadow-lg shadow-green-500/20"
                >
                  <CheckCircle2 className="ml-2 h-6 w-6" /> توثيق الحساب
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleAction(req, 'reject')}
                  className="h-16 rounded-2xl font-black text-lg shadow-lg shadow-red-500/20"
                >
                  <XCircle className="ml-2 h-6 w-6" /> رفض الطلب
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!requests || requests.length === 0) && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-muted text-muted-foreground">
            <ShieldCheck className="mx-auto h-20 w-20 opacity-20 mb-6" />
            <p className="text-2xl font-black">لا توجد طلبات توثيق جديدة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}
