
"use client";

import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, addDoc, query, orderBy, updateDoc, getDocs } from "firebase/firestore";
import { 
  Clock, 
  User, 
  BadgeCent, 
  Calendar, 
  CheckCircle2, 
  Tag, 
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Target,
  FileText,
  Loader2,
  Star,
  Paperclip,
  DollarSign,
  Zap,
  Wallet,
  Play,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function RequestDetailsPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    amount: "",
    duration: "",
    details: ""
  });

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId as string);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return query(collection(firestore, "istifhams", requestId as string, "offers"), orderBy("createdAt", "desc"));
  }, [firestore, requestId]);

  const { data: offers } = useCollection(offersQuery);

  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !request?.mustafhemId) return null;
    return doc(firestore, "users", request.mustafhemId);
  }, [firestore, request?.mustafhemId]);

  const { data: owner } = useDoc(ownerRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, "users", currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: profile } = useDoc(userRef);

  const goToCheckout = (customOfferId?: string) => {
    let url = `/checkout/${requestId}`;
    if (customOfferId) url += `?offerId=${customOfferId}`;
    router.push(url);
  };

  const handleSubmitOffer = async () => {
    if (!firestore || !currentUser || !profile || !request) return;
    if (!offerForm.amount || !offerForm.duration || !offerForm.details) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }

    setIsSubmittingOffer(true);
    try {
      await addDoc(collection(firestore, "istifhams", request.id, "offers"), {
        requestId: request.id,
        requestTitle: request.title,
        mustafhemId: request.mustafhemId,
        mufhemId: currentUser.uid,
        mufhemName: profile.fullName,
        mufhemAvatar: profile.profilePictureUrl,
        mufhemSpecialization: profile.specialization || "خبير عام",
        amount: Number(offerForm.amount),
        duration: offerForm.duration,
        details: offerForm.details,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      toast({ title: "تم تقديم العرض بنجاح" });
      setOfferForm({ amount: "", duration: "", details: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-bold">جاري تحميل تفاصيل الاستفهام...</div>;
  if (!request) return <div className="p-20 text-center font-bold text-red-500">الاستفهام غير موجود.</div>;

  const isOwner = currentUser?.uid === request.mustafhemId;

  return (
    <div className="bg-zinc-50 min-h-screen pb-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-white gap-2 font-bold text-zinc-600"><ChevronRight size={18} /> العودة</Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-10 space-y-10">
                <div className="border-b pb-6 text-right flex justify-between items-center">
                  <h1 className="text-3xl font-black text-zinc-900">{request.title}</h1>
                  <Badge variant="outline" className="text-primary font-black px-4 py-1">{request.category}</Badge>
                </div>
                <p className="text-zinc-700 text-lg leading-relaxed bg-zinc-50 p-8 rounded-[2rem] border-2 border-dashed">{request.description}</p>
                {request.goal && <div className="space-y-4"><h4 className="font-black text-zinc-800 flex items-center gap-2 justify-end">هدف الاستفهام <Target size={18} className="text-accent" /></h4><p className="text-zinc-700 text-lg font-bold italic bg-accent/5 p-8 rounded-[2rem] border-2 border-accent/10">"{request.goal}"</p></div>}
                
                {isOwner && request.status === 'accepted' && (
                  <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                    <div className="text-right">
                      <h4 className="text-xl font-black text-blue-900">المفهم "{request.mufhemName}" قبل طلبك!</h4>
                      <p className="text-blue-700 font-bold">يرجى إتمام الدفع لفتح غرفة المحاضرة فوراً.</p>
                    </div>
                    <Button onClick={() => goToCheckout()} className="h-16 px-10 rounded-2xl bg-blue-600 text-white font-black text-xl shadow-xl flex items-center gap-2">
                      <CreditCard size={24}/> ادفع {request.amount} ج.م وابدأ
                    </Button>
                  </div>
                )}

                {isOwner && request.status === 'paid' && (
                  <div className="bg-green-50 p-8 rounded-[2rem] border-2 border-green-200 flex items-center justify-between">
                    <div className="text-right"><h4 className="text-xl font-black text-green-900">المحاضرة مدفوعة وجاهزة!</h4></div>
                    <Button onClick={() => router.push(`/meeting/${request.id}`)} className="h-16 px-10 rounded-2xl bg-green-600 font-black text-xl"><Play className="ml-2"/> دخول المحاضرة</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isOwner && profile?.role === 'mufhem' && request.status === 'active' && (
              <Card className="rounded-xl border shadow-sm bg-white">
                <div className="p-6 border-b bg-zinc-50/50"><h3 className="text-xl font-black">تقدم للمشروع</h3></div>
                <CardContent className="p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2"><Label className="font-black">مدة التسليم (أيام)</Label><Input type="number" value={offerForm.duration} onChange={(e)=>setOfferForm({...offerForm, duration: e.target.value})} className="h-14 rounded-xl border-2" /></div>
                    <div className="space-y-2"><Label className="font-black">قيمة العرض (ج.م)</Label><Input type="number" value={offerForm.amount} onChange={(e)=>setOfferForm({...offerForm, amount: e.target.value})} className="h-14 rounded-xl border-2" /></div>
                  </div>
                  <div className="space-y-2"><Label className="font-black">تفاصيل العرض</Label><Textarea value={offerForm.details} onChange={(e)=>setOfferForm({...offerForm, details: e.target.value})} className="h-40 rounded-xl border-2 p-4" /></div>
                  <Button onClick={handleSubmitOffer} disabled={isSubmittingOffer} className="w-full h-16 rounded-xl font-black text-xl">{isSubmittingOffer ? <Loader2 className="animate-spin" /> : "أرسل العرض"}</Button>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <div className="space-y-8">
                <h3 className="text-2xl font-black border-r-8 border-primary pr-6">العروض المقدمة ({offers?.length || 0})</h3>
                <div className="space-y-6">
                  {offers?.map((offer) => (
                    <Card key={offer.id} className={`rounded-[2rem] border-2 bg-white ${offer.status === 'accepted' ? 'border-green-500' : ''}`}>
                      <CardContent className="p-8 flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex gap-6 items-center flex-1 text-right">
                          <Avatar className="h-16 w-16 shadow-md"><AvatarImage src={offer.mufhemAvatar} /><AvatarFallback>{offer.mufhemName?.charAt(0)}</AvatarFallback></Avatar>
                          <div><h4 className="font-black text-xl">{offer.mufhemName}</h4><p className="text-zinc-500 italic text-sm">"{offer.details}"</p></div>
                        </div>
                        <div className="shrink-0 flex flex-col items-center gap-4">
                          <div className="text-center"><p className="text-[10px] font-black text-muted-foreground">القيمة</p><h5 className="text-2xl font-black text-primary">{offer.amount} ج.م</h5></div>
                          {request.status === 'active' && <Button onClick={() => goToCheckout(offer.id)} className="h-12 px-8 rounded-xl font-black bg-green-600"><CreditCard size={16} className="ml-2"/> قبول الدفع</Button>}
                          {offer.status === 'accepted' && <Badge className="bg-green-100 text-green-600 h-10 px-6 rounded-xl">عرض مقبول</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl bg-white p-6 space-y-4">
              <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">حالة المشروع</span><Badge className={request.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}>{request.status === 'paid' ? 'مدفوع' : request.status}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">الميزانية</span><span className="text-primary font-black text-xl">{request.amount} ج.م</span></div>
            </Card>
            <Card className="rounded-2xl bg-white overflow-hidden">
              <div className="p-6 border-b bg-zinc-50/50 text-right"><h4 className="font-black text-zinc-800">صاحب الاستفهام</h4></div>
              <CardContent className="p-6 flex items-center gap-4 justify-end">
                <div className="text-right"><p className="font-black text-zinc-900">{request.mustafhemName}</p><p className="text-xs text-zinc-500">موثق <ShieldCheck size={12} className="inline text-blue-500" /></p></div>
                <Avatar className="h-14 w-14 border-2"><AvatarImage src={owner?.profilePictureUrl} /><AvatarFallback>{request.mustafhemName?.charAt(0)}</AvatarFallback></Avatar>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
