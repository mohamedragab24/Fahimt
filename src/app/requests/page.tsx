
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, XCircle, Timer, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function RequestsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "requests");
  }, [firestore, user]);

  const myRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef || !user) return null;
    // We want to see requests where user is either the student OR the teacher
    return query(requestsRef, where("studentId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [requestsRef, user]);

  const myTeachingQuery = useMemoFirebase(() => {
    if (!requestsRef || !user) return null;
    return query(requestsRef, where("teacherId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [requestsRef, user]);

  const { data: studentRequests, isLoading: isLoadingStudent } = useCollection(myRequestsQuery);
  const { data: teacherRequests, isLoading: isLoadingTeacher } = useCollection(myTeachingQuery);

  const allRequests = [...(studentRequests || []), ...(teacherRequests || [])].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (isLoadingStudent || isLoadingTeacher) return <div className="p-10 text-center font-bold">جاري تحميل طلباتك...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2 border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة طلباتي</h1>
        <p className="text-muted-foreground text-lg">تتبع جلساتك التعليمية وحالة الطلبات التي قمت بها أو قبلتها.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-4 h-16 p-2 bg-muted/50 rounded-2xl">
          <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md text-lg">قيد الانتظار</TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md text-lg">المقبولة</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md text-lg">المكتملة</TabsTrigger>
          <TabsTrigger value="canceled" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md text-lg">الملغية</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {['pending', 'accepted', 'completed', 'canceled'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-6">
              <RequestList requests={allRequests.filter(r => r.status === status) || []} status={status} userId={user?.uid} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

function RequestList({ requests, status, userId }: { requests: any[], status: string, userId?: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleAction = (requestId: string, action: 'cancel' | 'complete') => {
    if (!firestore) return;
    const reqRef = doc(firestore, "requests", requestId);
    
    if (action === 'cancel') {
      updateDocumentNonBlocking(reqRef, { status: 'canceled' });
      toast({ title: "تم إلغاء الطلب", description: "تم تحديث حالة الطلب إلى ملغي." });
    } else if (action === 'complete') {
      updateDocumentNonBlocking(reqRef, { status: 'completed' });
      toast({ title: "مبروك! اكتملت الجلسة", description: "تم تحديث الطلب كمكتمل بنجاح." });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border-4 border-dashed border-muted-foreground/20">
        <div className="mb-4 flex justify-center opacity-20"><Timer size={60} /></div>
        <p className="text-muted-foreground text-xl">لا توجد طلبات في هذا القسم حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {requests.map((req) => (
        <Card key={req.id} className="shadow-md border-2 overflow-hidden hover:border-primary/30 transition-all rounded-2xl">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="p-8 flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2">{req.category}</Badge>
                  <CardTitle className="text-2xl font-bold">{req.title}</CardTitle>
                </div>
                <Badge className={`px-4 py-1 text-md ${
                  status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                  status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                  status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {status === 'pending' && <Timer className="h-4 w-4 ml-2" />}
                  {status === 'accepted' && <CheckCircle2 className="h-4 w-4 ml-2" />}
                  {status === 'completed' && <CheckCircle2 className="h-4 w-4 ml-2" />}
                  {status === 'canceled' && <XCircle className="h-4 w-4 ml-2" />}
                  {status === 'pending' ? 'بانتظار الموافقة' : status === 'accepted' ? 'تم القبول' : status === 'completed' ? 'مكتمل' : 'ملغي'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-md text-muted-foreground bg-muted/20 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{new Date(req.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3 font-bold text-primary text-lg">
                  <BadgeCent className="h-5 w-5" />
                  <span>{req.amount} ج.م</span>
                </div>
                <div className="flex items-center gap-3 truncate">
                  <User className="h-5 w-5 text-primary" />
                  <span className="truncate">{req.studentId === userId ? `المدرس: ${req.teacherName || '---'}` : `المستفهم: ${req.studentName}`}</span>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-6 md:w-56 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-r">
              {status === 'pending' && req.studentId === userId && (
                <Button variant="destructive" className="w-full py-6 font-bold rounded-xl" onClick={() => handleAction(req.id, 'cancel')}>
                  <Trash2 className="h-5 w-5 ml-2" /> إلغاء الطلب
                </Button>
              )}
              {status === 'accepted' && (
                <>
                  <Button className="w-full bg-primary py-6 font-bold rounded-xl shadow-lg">بدء الجلسة</Button>
                  {req.teacherId === userId && (
                    <Button variant="outline" className="w-full py-6 font-bold rounded-xl border-primary text-primary" onClick={() => handleAction(req.id, 'complete')}>
                      إكمال الجلسة
                    </Button>
                  )}
                </>
              )}
              {status === 'completed' && (
                <Button variant="outline" className="w-full py-6 font-bold rounded-xl">تقييم التجربة</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
