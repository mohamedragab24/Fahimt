
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc, collectionGroup } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  BadgeCent, 
  Star, 
  CreditCard, 
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
  SendHorizontal,
  History,
  Timer,
  XCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة "عروضي" المطورة - تظهر للمفهم كافة العروض التي قدمها على استفهامات الآخرين.
 */
export default function MySentOffersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // جلب كافة الاستفهامات التي شارك فيها المستخدم كمفهم من خلال البحث في العروض
  // ملاحظة: تم تبسيط المنطق هنا لجلب كافة الاستفهامات المفتوحة ثم فلترة العروض المرتبطة بالمستخدم برمجياً لضمان العمل بدون Collection Group Indexes في البداية
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: allRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  if (isUserLoading || isRequestsLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 bg-white min-h-screen" dir="rtl">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="font-black text-2xl">جاري جلب سجل عروضك...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-1 text-right">
          <h1 className="text-4xl font-black font-headline text-zinc-900">عروضي المرسلة</h1>
          <p className="text-muted-foreground text-lg font-bold">تتبع حالة العروض التي قدمتها للمستفهمين لمساعدتهم.</p>
        </div>
      </div>

      <div className="grid gap-8">
        <OfferHistoryList allRequests={allRequests} userId={user?.uid} router={router} />
      </div>
    </div>
  );
}

function OfferHistoryList({ allRequests, userId, router }: any) {
  const firestore = useFirestore();
  const [sentOffers, setSentOffers] = Array.from(new Set()); // محاكاة تجميع البيانات

  if (!allRequests || allRequests.length === 0) {
    return (
      <div className="py-32 text-center bg-zinc-50 rounded-[4rem] border-4 border-dashed border-zinc-100 flex flex-col items-center gap-6">
        <History size={64} className="text-zinc-200" />
        <p className="text-2xl font-black text-zinc-300">لم تقم بتقديم أي عروض بعد.</p>
        <Button onClick={() => router.push('/browse')} className="h-14 px-8 rounded-2xl font-black">تصفح الاستفهامات المتاحة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allRequests.map((req: any) => (
        <OfferItem key={req.id} request={req} userId={userId} router={router} />
      ))}
    </div>
  );
}

function OfferItem({ request, userId, router }: any) {
  const firestore = useFirestore();
  
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !request.id || !userId) return null;
    return query(collection(firestore, "istifhams", request.id, "offers"), where("mufhemId", "==", userId));
  }, [firestore, request.id, userId]);

  const { data: myOffers, isLoading } = useCollection(offersQuery);

  if (isLoading || !myOffers || myOffers.length === 0) return null;

  const offer = myOffers[0]; // عرض المستخدم الوحيد على هذا الطلب

  return (
    <Card className="rounded-[2.5rem] border-2 bg-white overflow-hidden hover:shadow-xl transition-all shadow-md group">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="text-right flex-1 space-y-4">
            <div className="flex items-center gap-3 justify-end md:justify-start">
              <Badge className={
                offer.status === 'accepted' ? 'bg-green-100 text-green-600' : 
                offer.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }>
                {offer.status === 'accepted' ? 'تم القبول' : offer.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
              </Badge>
              <span className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock size={12}/> {new Date(offer.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>
            
            <h3 className="text-2xl font-black text-zinc-900 group-hover:text-primary transition-colors">{request.title}</h3>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-dashed text-sm font-medium italic text-zinc-600">
              عرضك: "{offer.details}"
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-bold text-muted-foreground pt-2">
              <span className="flex items-center gap-2"><BadgeCent size={16} className="text-primary"/> سعرك: {offer.amount} ج.م</span>
              <span className="flex items-center gap-2"><Timer size={16} className="text-primary"/> الإنجاز: {offer.duration} يوم</span>
              <span className="flex items-center gap-2"><User size={16} className="text-primary"/> المستفهم: {request.mustafhemName}</span>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col justify-center gap-3 md:w-48">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/requests/${request.id}`)}
              className="h-14 rounded-2xl font-black text-lg border-primary text-primary hover:bg-primary/5"
            >
              عرض الطلب <ArrowRight size={18} className="mr-2 rotate-180" />
            </Button>
            {offer.status === 'accepted' && (
              <Button 
                onClick={() => router.push(`/meeting/${request.id}`)} 
                className="h-14 rounded-2xl font-black text-lg bg-green-600 shadow-lg"
              >
                دخول المحاضرة
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
