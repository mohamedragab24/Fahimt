
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Trash2, 
  User, 
  BadgeCent,
  AlertCircle,
  ClipboardList,
  Video,
  Copy,
  Check,
  Star,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, limit } from "firebase/firestore";
import { updateDocumentNonBlocking, createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function RequestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "requests");
  }, [firestore, user]);

  const studentQuery = useMemoFirebase(() => {
    if (!requestsRef || !user?.uid) return null;
    return query(requestsRef, where("studentId", "==", user.uid), limit(50));
  }, [requestsRef, user?.uid]);

  const teacherQuery = useMemoFirebase(() => {
    if (!requestsRef || !user?.uid) return null;
    return query(requestsRef, where("teacherId", "==", user.uid), limit(50));
  }, [requestsRef, user?.uid]);

  const { data: studentRequests, isLoading: isLoadingStudent } = useCollection(studentQuery);
  const { data: teacherRequests, isLoading: isLoadingTeacher } = useCollection(teacherQuery);

  const allRequests = [...(studentRequests || []), ...(teacherRequests || [])];
  
  const uniqueRequests = Array.from(new Map(allRequests.map(item => [item.id, item])).values())
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isUserLoading || isLoadingStudent || isLoadingTeacher) {
    return <div className="p-10 text-center font-bold animate-pulse">جاري تحميل طلباتك...</div>;
  }

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6 bg-white/50 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1 text-right">
          <h1 className="text-3xl md:text-4xl font-black font-headline">إدارة الطلبات</h1>
          <p className="text-muted-foreground text-lg">تتبع حالة طلباتك والوصول للمحاضرات المباشرة.</p>
        </div>
        <div className="bg-primary/10 px-6 py-3 rounded-2xl flex items-center gap-3">
          <BadgeCent className="text-primary h-6 w-6" />
          <span className="font-bold text-primary text-xl">{uniqueRequests.length} طلب إجمالي</span>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-20 p-2 bg-muted/40 rounded-[1.5rem] md:rounded-[2rem] shadow-inner mb-10 gap-2">
          <TabsTrigger value="pending" className="rounded-xl md:rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-lg font-bold flex gap-2 transition-all py-3">
            <Timer className="h-4 w-4 md:h-5 md:w-5" /> الانتظار
          </TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-xl md:rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-lg font-bold flex gap-2 transition-all py-3">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" /> المقبولة
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl md:rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-lg font-bold flex gap-2 transition-all py-3">
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> المكتملة
          </TabsTrigger>
          <TabsTrigger value="canceled" className="rounded-xl md:rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-sm md:text-lg font-bold flex gap-2 transition-all py-3">
            <XCircle className="h-4 w-4 md:h-5 md:w-5" /> الملغية
          </TabsTrigger>
        </TabsList>

        {['pending', 'accepted', 'completed', 'canceled'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-8 focus-visible:ring-0">
            <RequestList 
              requests={uniqueRequests.filter((r: any) => r.status === status)} 
              status={status} 
              userId={user?.uid} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function RequestList({ requests, status, userId }: { requests: any[], status: string, userId?: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAction = (req: any, action: 'cancel' | 'complete') => {
    if (!firestore) return;
    const reqRef = doc(firestore, "requests", req.id);
    
    if (action === 'cancel') {
      updateDocumentNonBlocking(reqRef, { status: 'canceled' });
      toast({ title: "تم إلغاء الطلب", description: "تم تحديث حالة الطلب إلى ملغي بنجاح." });
    } else if (action === 'complete') {
      updateDocumentNonBlocking(reqRef, { status: 'completed' });
      
      createTransactionNonBlocking(firestore, req.teacherId, {
        amount: req.amount * 0.8,
        type: 'earning',
        details: `أرباح جلسة: ${req.title}`,
        requestId: req.id,
        status: 'completed'
      });

      createTransactionNonBlocking(firestore, req.studentId, {
        amount: req.amount,
        type: 'payment',
        details: `دفع رسوم جلسة: ${req.title}`,
        requestId: req.id,
        status: 'completed'
      });

      toast({ 
        title: "تمت المهمة!", 
        description: "تم إكمال الجلسة وتحويل المبالغ بنجاح.",
      });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({ title: "تم النسخ", description: "تم نسخ معرف الطلب." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-32 bg-white rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-muted shadow-sm px-4 text-center">
        <div className="bg-muted/30 p-6 md:p-8 rounded-full mb-6">
          <ClipboardList size={48} className="text-muted-foreground opacity-30" />
        </div>
        <p className="text-muted-foreground text-xl md:text-2xl font-black">لا توجد طلبات في هذا القسم حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      {requests.map((req) => (
        <Card key={req.id} className="shadow-xl border-2 hover:border-primary/40 transition-all rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white group">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 md:p-10 flex-1 space-y-8 text-right">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-3">
                  <div className="flex gap-2 justify-end md:justify-start">
                    <Badge variant="secondary" className="px-4 py-1 text-md font-bold bg-primary/10 text-primary border-none">{req.category}</Badge>
                    <Badge 
                      variant="outline" 
                      className="px-4 py-1 text-md font-bold text-muted-foreground cursor-pointer hover:bg-muted"
                      onClick={() => copyId(req.id)}
                    >
                      {copiedId === req.id ? <Check className="h-3 w-3 ml-2 text-green-500" /> : <Copy className="h-3 w-3 ml-2" />}
                      ID: {req.id.slice(-5)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-black leading-tight group-hover:text-primary transition-colors">{req.title}</CardTitle>
                </div>
                <div className="text-center bg-muted/20 p-4 rounded-2xl min-w-[120px] self-center md:self-start">
                  <span className="text-sm font-bold text-muted-foreground block mb-1">المبلغ</span>
                  <span className="text-3xl font-black text-primary tabular-nums">{req.amount}</span>
                  <span className="text-xs font-bold text-primary mr-1">ج.م</span>
                </div>
              </div>

              {req.status === 'completed' && req.rating && (
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-5 w-5 ${req.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                    ))}
                  </div>
                  <span className="text-yellow-700 font-bold italic">"{req.review || "تجربة رائعة!"}"</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 p-6 bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20">
                <div className="flex items-center gap-4 justify-end md:justify-start">
                  <div className="bg-white p-3 rounded-xl shadow-sm"><Calendar className="h-6 w-6 text-primary" /></div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-bold block">التاريخ</span>
                    <span className="font-bold">{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-end md:justify-start">
                  <div className="bg-white p-3 rounded-xl shadow-sm"><User className="h-6 w-6 text-primary" /></div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-bold block">{req.studentId === userId ? "المُفهم (المدرس)" : "المُستفهم (الطالب)"}</span>
                    <span className="font-bold truncate max-w-[150px] flex items-center gap-2">
                      {req.studentId === userId ? (
                        <>
                          {req.teacherName || "بانتظار قبول مدرس..."}
                          {req.teacherName && <ShieldCheck className="h-4 w-4 text-blue-500 fill-blue-500/20" />}
                        </>
                      ) : (req.studentName || "مستفهم")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-end md:justify-start">
                  <div className="bg-white p-3 rounded-xl shadow-sm"><BadgeCent className="h-6 w-6 text-primary" /></div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-bold block">الحالة</span>
                    <span className="font-bold">{status === 'pending' ? 'قيد البحث' : status === 'accepted' ? 'جاهز للبث' : status === 'completed' ? 'تم بنجاح' : 'ملغي'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 p-6 md:p-8 md:w-80 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-r border-dashed">
              {status === 'pending' && req.studentId === userId && (
                <Button 
                  variant="destructive" 
                  className="w-full py-8 md:py-10 font-black text-xl rounded-2xl shadow-lg hover:scale-[1.02] transition-transform" 
                  onClick={() => handleAction(req, 'cancel')}
                >
                  <Trash2 className="h-6 w-6 ml-3" /> إلغاء الطلب
                </Button>
              )}
              {status === 'accepted' && (
                <>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 py-10 md:py-12 font-black text-xl md:text-2xl rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
                    onClick={() => router.push(`/meeting/${req.id}`)}
                  >
                    <Video className="h-8 w-8 ml-4" /> دخول المحاضرة
                  </Button>
                </>
              )}
              {status === 'completed' && (
                <div className="flex flex-col items-center gap-3 text-green-600 font-black text-center">
                  <CheckCircle2 size={48} />
                  <span className="text-xl">تمت المحاضرة بنجاح</span>
                </div>
              )}
              {status === 'canceled' && (
                <div className="flex flex-col items-center gap-3 text-muted-foreground font-black text-center">
                  <XCircle size={48} />
                  <span className="text-xl">تم إلغاء الطلب</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
