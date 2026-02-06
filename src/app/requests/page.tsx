
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, XCircle, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function RequestsPage() {
  const { user } = useUser();
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };

  const requestsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "requests");
  }, [firestore, user]);

  const { data: requests, isLoading } = useCollection(requestsRef);

  if (isLoading) return <div className="p-10 text-center font-bold">جاري تحميل طلباتك...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline">طلباتي</h1>
        <p className="text-muted-foreground">إدارة ومتابعة جميع جلساتك التعليمية</p>
      </div>

      <Tabs defaultValue="pending" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-muted rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white">قيد الانتظار</TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-white">المقبولة</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white">المكتملة</TabsTrigger>
          <TabsTrigger value="canceled" className="rounded-lg data-[state=active]:bg-white">الملغية</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {['pending', 'accepted', 'completed', 'canceled'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              <RequestList requests={requests?.filter(r => r.status === status) || []} status={status} userId={user?.uid} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

function RequestList({ requests, status, userId }: { requests: any[], status: string, userId?: string }) {
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };
  const { toast } = useToast();

  const handleCancel = (requestId: string) => {
    if (!firestore || !userId) return;
    const reqRef = doc(firestore, "users", userId, "requests", requestId);
    deleteDocumentNonBlocking(reqRef);
    toast({
      title: "تم الحذف",
      description: "تم حذف الطلب بنجاح.",
    });
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-muted-foreground/30">
        <p className="text-muted-foreground">لا توجد طلبات في هذا القسم حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((req) => (
        <Card key={req.id} className="shadow-sm border-2 overflow-hidden hover:border-primary/20 transition-all">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold">{req.title}</CardTitle>
                <Badge variant={status === 'completed' ? 'default' : status === 'canceled' ? 'destructive' : 'secondary'} className="px-3">
                  {status === 'pending' && <Timer className="h-3 w-3 ml-1" />}
                  {status === 'accepted' && <CheckCircle2 className="h-3 w-3 ml-1" />}
                  {status === 'completed' && <CheckCircle2 className="h-3 w-3 ml-1" />}
                  {status === 'canceled' && <XCircle className="h-3 w-3 ml-1" />}
                  {status === 'pending' ? 'بانتظار الموافقة' : status === 'accepted' ? 'تم القبول' : status === 'completed' ? 'مكتمل' : 'ملغي'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(req.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-primary">
                  <span>المبلغ: {req.amount} ج.م</span>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-4 md:w-48 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-r">
              {status === 'pending' && (
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={() => handleCancel(req.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> إلغاء الطلب
                </Button>
              )}
              {status === 'accepted' && (
                <Button className="w-full bg-primary font-bold">بدء الميتنج</Button>
              )}
              {status === 'completed' && (
                <Button variant="outline" className="w-full">طلب مراجعة</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
