
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
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة العروض المتقدمة - مجمعة لكل عروض المستفهم.
 */
export default function AdvancedOffersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("mustafhemId", "==", user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: myRequests, isLoading } = useCollection(offersQuery);

  const requestsWithOffers = myRequests?.filter(r => r.status === 'active' || r.status === 'accepted') || [];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="border-r-8 border-primary pr-6 text-right">
        <h1 className="text-4xl font-black font-headline text-zinc-900">العروض المتقدمة</h1>
        <p className="text-muted-foreground text-lg">راجع عروض المفهمين المخصصة على استفهاماتك المفتوحة.</p>
      </div>

      <div className="grid gap-8">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-black text-2xl">جاري جلب العروض...</div>
        ) : requestsWithOffers.length > 0 ? (
          requestsWithOffers.map((req) => (
            <OfferRequestGroup key={req.id} request={req} router={router} />
          ))
        ) : (
          <div className="py-32 text-center bg-zinc-50 rounded-[3rem] border-4 border-dashed border-zinc-100 flex flex-col items-center gap-6">
            <div className="bg-white p-8 rounded-full shadow-inner"><MessageSquare size={64} className="text-zinc-200" /></div>
            <p className="text-2xl font-black text-zinc-300">لا توجد عروض متقدمة على طلباتك حالياً.</p>
            <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl font-bold">طرح استفهام جديد</Button>
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

  const { data: offers } = useCollection(offersQuery);

  const goToCheckout = (offer: any) => {
    router.push(`/checkout/${request.id}?offerId=${offer.id}`);
  };

  if (!offers || offers.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-primary flex items-center gap-2">
          <Zap size={20} className="text-accent" /> عروض على: {request.title}
        </h3>
        <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{offers.length} عرض</Badge>
      </div>

      <div className="grid gap-4">
        {offers.map((offer: any) => (
          <Card key={offer.id} className={`rounded-3xl border-2 transition-all hover:border-primary/20 bg-white overflow-hidden ${offer.status === 'accepted' ? 'border-green-500 ring-4 ring-green-50' : ''}`}>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-4 items-start text-right flex-1">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                    <AvatarImage src={offer.mufhemAvatar} />
                    <AvatarFallback>{offer.mufhemName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 justify-end md:justify-start">
                      <h4 className="font-black text-lg">{offer.mufhemName}</h4>
                      <div className="flex gap-0.5"><Star size={12} className="fill-yellow-400 text-yellow-400" /> <span className="text-xs font-black">5.0</span></div>
                    </div>
                    <p className="text-zinc-600 text-sm line-clamp-2 italic">"{offer.details}"</p>
                    <div className="flex gap-4 text-[10px] font-bold text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><Clock size={12} /> {offer.duration} يوم</span>
                      <span className="flex items-center gap-1"><BadgeCent size={12} /> {offer.amount} ج.م</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col justify-center items-center gap-3">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">القيمة</p>
                    <p className="text-2xl font-black text-primary">{offer.amount} <span className="text-xs">ج.م</span></p>
                  </div>
                  {(request.status === 'active' || request.status === 'accepted') && offer.status !== 'accepted' && (
                    <Button onClick={() => goToCheckout(offer)} className="h-12 rounded-xl font-black px-6 shadow-md bg-green-600 hover:bg-green-700 flex items-center gap-2">
                      <CreditCard size={16} /> قبول الدفع والبدء
                    </Button>
                  )}
                  {(offer.status === 'accepted' || request.status === 'paid') && (
                    <Badge className="bg-green-100 text-green-600 font-black h-10 px-6 rounded-xl flex items-center gap-2">
                      <CheckCircle2 size={16} /> عرض مدفوع ومقبول
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
