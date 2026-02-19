
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc, getDocs, setDoc } from "firebase/firestore";
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
  SendHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة العروض المتقدمة - تتيح للمستفهم التواصل المباشر مع المفهمين.
 */
export default function AdvancedOffersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "istifhams"), where("mustafhemId", "==", user.uid));
  }, [firestore, user?.uid]);

  const { data: myRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);
  const activeRequests = myRequests?.filter(r => r.status === 'active' || r.status === 'accepted') || [];

  if (isUserLoading || isRequestsLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 bg-white min-h-screen" dir="rtl">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="font-black text-2xl">جاري جلب العروض المباشرة...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-1 text-right">
          <h1 className="text-4xl font-black font-headline text-zinc-900">العروض المباشرة</h1>
          <p className="text-muted-foreground text-lg font-bold">تواصل الآن مباشرة مع المفهمين لمناقشة تفاصيل استفهامك.</p>
        </div>
      </div>

      <div className="grid gap-12">
        {activeRequests.length > 0 ? (
          activeRequests.map((req) => (
            <OfferRequestGroup key={req.id} request={req} router={router} user={user} />
          ))
        ) : (
          <div className="py-32 text-center bg-zinc-50 rounded-[4rem] border-4 border-dashed border-zinc-100 flex flex-col items-center gap-6">
            <MessageSquare size={64} className="text-zinc-200" />
            <p className="text-2xl font-black text-zinc-300">لا توجد عروض على طلباتك حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OfferRequestGroup({ request, router, user }: any) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !request.id) return null;
    return query(collection(firestore, "istifhams", request.id, "offers"), orderBy("createdAt", "desc"));
  }, [firestore, request.id]);

  const { data: offers, isLoading } = useCollection(offersQuery);

  const startChat = async (offer: any) => {
    if (!firestore || !user) return;
    
    // إنشاء معرف فريد للمحادثة يربط المستفهم والمفهم والطلب بشكل مباشر
    const chatId = `${request.id}_${offer.mufhemId}`;
    const chatRef = doc(firestore, "direct_chats", chatId);

    try {
      await setDoc(chatRef, {
        id: chatId,
        requestId: request.id,
        requestTitle: request.title,
        studentId: user.uid,
        studentName: user.displayName || "مستفهم",
        teacherId: offer.mufhemId,
        teacherName: offer.mufhemName,
        teacherAvatar: offer.mufhemAvatar || "",
        participants: [user.uid, offer.mufhemId],
        lastMessage: "بدأ المستفهم محادثة مباشرة معك.",
        updatedAt: new Date().toISOString(),
        hasUnread: true,
        lastSenderId: user.uid
      }, { merge: true });

      // الانتقال الفوري لصفحة الدردشة
      router.push(`/messages/${chatId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل فتح قناة التواصل المباشر." });
    }
  };

  if (!isLoading && (!offers || offers.length === 0)) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-6 py-4 bg-white rounded-3xl border shadow-sm">
        <h3 className="text-xl font-black text-zinc-800 flex items-center gap-3">
          <Badge className="bg-primary text-white rounded-lg h-8 w-8 p-0 flex items-center justify-center"><Zap size={16} /></Badge>
          <span>عروض على: <span className="text-primary">{request.title}</span></span>
        </h3>
      </div>

      <div className="grid gap-6 pr-4 border-r-4 border-dashed border-zinc-100 mr-4">
        {isLoading ? (
          <div className="p-10 text-center animate-pulse font-bold text-zinc-300">جاري تحميل العروض...</div>
        ) : offers?.map((offer: any) => (
          <Card key={offer.id} className="rounded-[2.5rem] border-2 bg-white overflow-hidden hover:shadow-xl transition-all shadow-md group">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex gap-6 items-start text-right flex-1">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl shrink-0">
                    <AvatarImage src={offer.mufhemAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">{offer.mufhemName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 justify-end md:justify-start">
                      <h4 className="font-black text-2xl text-zinc-900">{offer.mufhemName}</h4>
                      <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 font-bold px-3">5.0 <Star size={12} className="fill-yellow-500 ml-1" /></Badge>
                    </div>
                    <p className="text-zinc-600 text-lg font-medium leading-relaxed italic line-clamp-2">"{offer.details}"</p>
                    <div className="flex flex-wrap gap-4 text-sm font-bold text-muted-foreground mt-4 pt-4 border-t border-dashed">
                      <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl"><Clock size={16} /> الموعد: خلال {offer.duration} يوم</span>
                      <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl"><BadgeCent size={16} /> السعر: {offer.amount} ج.م</span>
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 flex flex-col justify-center gap-3 md:w-64">
                  <Button 
                    onClick={() => router.push(`/checkout/${request.id}?offerId=${offer.id}`)} 
                    className="h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                  >
                    <CreditCard size={20} className="ml-2" /> قبول وبدء الجلسة
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => startChat(offer)}
                    className="h-14 rounded-2xl font-black text-lg border-primary text-primary hover:bg-primary/5"
                  >
                    <SendHorizontal size={20} className="ml-2 rotate-180" /> تواصل مباشر مع المفهم
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
