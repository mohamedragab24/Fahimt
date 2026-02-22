"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  BadgeCent, 
  Loader2,
  ArrowRight,
  Zap,
  History,
  Timer,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MySentOffersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: allRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  if (isUserLoading || isRequestsLoading) return <div className="p-20 text-center font-black">جاري التحميل...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <h1 className="text-4xl font-black text-right border-r-8 border-primary pr-6">عروضي المرسلة</h1>
      <div className="grid gap-8">
        {allRequests?.map((req: any) => (
          <OfferItem key={req.id} request={req} userId={user?.uid} router={router} />
        ))}
      </div>
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
  const offer = myOffers[0];

  return (
    <Card className="rounded-[2.5rem] border-2 bg-white p-8 shadow-md">
      <div className="flex flex-col md:flex-row justify-between gap-8 text-right">
        <div className="flex-1 space-y-4">
          <Badge className={offer.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}>
            {offer.status === 'accepted' ? 'تم القبول' : 'قيد المراجعة'}
          </Badge>
          <h3 className="text-2xl font-black">{request.title}</h3>
          <p className="italic text-zinc-600">عرضك: "{offer.details}"</p>
          <div className="flex gap-6 text-sm font-bold text-muted-foreground">
            <span className="flex items-center gap-2"><BadgeCent size={16}/> {offer.amount} ج.م</span>
            <span className="flex items-center gap-2"><Timer size={16}/> {offer.duration} يوم</span>
          </div>
        </div>
        <Button onClick={() => router.push(`/requests/${request.id}`)} className="h-14 px-8 rounded-2xl font-black bg-primary">عرض الطلب</Button>
      </div>
    </Card>
  );
}
