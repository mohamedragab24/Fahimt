
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, getDocs, addDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  BadgeCent, 
  User, 
  CheckCircle2, 
  ArrowRight,
  ClipboardList,
  Star,
  Zap,
  Wallet,
  CreditCard,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة العروض المتقدمة - تجمع كافة العروض الواردة للمستفهم على كافة طلباته.
 */
export default function AdvancedOffersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("mustafhemId", "==", user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: myRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  // عرض الطلبات المفتوحة أو المقبولة التي قد تحتوي على عروض
  const activeRequests = myRequests?.filter(r => r.status === 'active' || r.status === 'accepted') || [];

  if (isUserLoading || isRequestsLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 bg-white min-h-screen" dir="rtl">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="font-black text-2xl">جاري جلب العروض المتقدمة...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline text-zinc-900">العروض المتقدمة</h1>
          <p className="text-muted-foreground text-lg">راجع عروض المفهمين المخصصة على استفهاماتك المفتوحة وقم بقبول الأفضل.</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl font-bold h-12 border-2 border-primary/20">
          طرح استفهام جديد <ArrowRight size={16} className="mr-2 rotate-180" />
        </Button>
      </div>

      <div className="grid gap-12">
        {activeRequests.length > 0 ? (
          activeRequests.map((req) => (
            <OfferRequestGroup key={req.id} request={req} router={router} />
          ))
        ) : (
          <div className="py-32 text-center bg-zinc-50 rounded-[4rem] border-4 border-dashed border-zinc-100 flex flex-col items-center gap-6">
            <div className="bg-white p-8 rounded-full shadow-inner shadow-black/5"><MessageSquare size={64} className="text-zinc-200" /></div>
            <p className="text-2xl font-black text-zinc-300">لا توجد عروض مخصصة على طلباتك حالياً.</p>
            <Button onClick={() => router.push('/')} className="rounded-[1.5rem] px-10 h-16 text-xl font-black shadow-xl">ابدأ بطرح أول سؤال</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function OfferRequestGroup({ request, router }: { request: any, router: any }) {
  const firestore = useFirestore();
  
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !request.id) return null;
    return query(collection(firestore, "istifhams", request.id, "offers"), orderBy("createdAt", "desc"));
  }, [firestore, request.id]);

  const { data: offers, isLoading } = useCollection(offersQuery);

  const goToCheckout = (offer: any) => {
    // التوجه لبوابة الدفع مع تمرير معرف العرض لخصم السعر المخصص
    router.push(`/checkout/${request.id}?offerId=${offer.id}`);
  };

  // لا نعرض القسم إذا لم تكن هناك عروض لهذا الطلب المحدد
  if (!isLoading && (!offers || offers.length === 0)) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-4 bg-white p-4 rounded-3xl border shadow-sm">
        <h3 className="text-xl font-black text-zinc-800 flex items-center gap-3">
          <Badge className="bg-primary text-white border-none rounded-lg h-8 w-8 p-0 flex items-center justify-center"><Zap size={16} /></Badge>
          <span>عروض مخصصة على: <span className="text-primary underline decoration-dotted">{request.title}</span></span>
        </h3>
        <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-4 py-1.5 font-black rounded-xl">
          {offers?.length || 0} عرض وارد
        </Badge>
      </div>

      <div className="grid gap-6 pr-4 border-r-4 border-dashed border-zinc-100 mr-4">
        {isLoading ? (
          <div className="p-10 text-center animate-pulse font-bold text-zinc-300">جاري تحميل العروض...</div>
        ) : offers?.map((offer: any) => (
          <Card key={offer.id} className={`rounded-[2.5rem] border-2 transition-all hover:border-primary/30 bg-white overflow-hidden group ${offer.status === 'accepted' ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.1)]' : 'shadow-md shadow-black/5 hover:shadow-xl'}`}>
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row justify-between gap-10">
                <div className="flex gap-6 items-start text-right flex-1">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl transition-transform group-hover:scale-110 shrink-0">
                    <AvatarImage src={offer.mufhemAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">{offer.mufhemName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 justify-end md:justify-start">
                      <h4 className="font-black text-2xl text-zinc-900 group-hover:text-primary transition-colors">{offer.mufhemName}</h4>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-black text-yellow-700">5.0</span>
                      </div>
                    </div>
                    <p className="text-zinc-600 text-lg font-medium leading-relaxed italic line-clamp-3">"{offer.details}"</p>
                    <div className="flex flex-wrap gap-6 text-sm font-bold text-muted-foreground mt-4 pt-4 border-t border-dashed">
                      <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl"><Clock size={16} className="text-primary" /> مدة التنفيذ: {offer.duration} يوم</span>
                      <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl"><BadgeCent size={16} className="text-accent" /> السعر المخصص: {offer.amount} ج.م</span>
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 flex flex-col justify-center items-center gap-6 md:border-r md:pr-10 md:mr-4">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">المبلغ المطلوب</p>
                    <p className="text-4xl font-black text-primary tabular-nums">{offer.amount} <span className="text-lg">ج.م</span></p>
                  </div>
                  
                  {offer.status !== 'accepted' && (
                    <Button 
                      onClick={() => goToCheckout(offer)} 
                      className="h-16 px-10 rounded-[1.5rem] font-black text-lg bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-600/20 flex items-center gap-3"
                    >
                      <CreditCard size={20} /> قبول الدفع والبدء
                    </Button>
                  )}
                  
                  {offer.status === 'accepted' && (
                    <Badge className="bg-green-100 text-green-600 font-black h-12 px-8 rounded-2xl flex items-center gap-3 border-none text-lg">
                      <CheckCircle2 size={24} /> عرض مقبول
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
