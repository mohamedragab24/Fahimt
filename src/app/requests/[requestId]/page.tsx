
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
  CreditCard,
  AlertCircle
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
  const params = useParams();
  const requestId = params?.requestId as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    amount: "",
    duration: "",
    details: ""
  });

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return query(collection(firestore, "istifhams", requestId, "offers"), orderBy("createdAt", "desc"));
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
      toast({ title: "تم تقديم العرض بنجاح", description: "سيتم إخطار المستفهم لمراجعة عرضك." });
      setOfferForm({ amount: "", duration: "", details: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-2xl flex flex-col items-center gap-4 bg-white min-h-screen" dir="rtl"><Loader2 className="animate-spin h-10 w-10 text-primary" /> جاري تحميل تفاصيل الاستفهام...</div>;
  if (!request) return <div className="p-20 text-center font-bold text-red-500">الاستفهام غير موجود.</div>;

  const isOwner = currentUser?.uid === request.mustafhemId;

  return (
    <div className="bg-zinc-50 min-h-screen pb-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-white gap-2 font-bold text-zinc-600">
          <ChevronRight size={18} className="rotate-180" /> العودة للخلف
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-10 space-y-10">
                <div className="border-b pb-6 text-right flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h1 className="text-3xl font-black text-zinc-900">{request.title}</h1>
                  <Badge variant="outline" className="text-primary font-black px-4 py-1 rounded-xl border-primary/20 bg-primary/5">{request.category}</Badge>
                </div>
                <div className="space-y-4">
                  <Label className="font-black text-zinc-400 flex items-center gap-2 justify-end uppercase text-xs tracking-widest">الوصف والتفاصيل <FileText size={14}/></Label>
                  <p className="text-zinc-700 text-lg leading-relaxed bg-zinc-50/50 p-8 rounded-[2rem] border-2 border-dashed">{request.description}</p>
                </div>
                {request.goal && (
                  <div className="space-y-4">
                    <h4 className="font-black text-zinc-800 flex items-center gap-2 justify-end">هدف الاستفهام <Target size={18} className="text-accent" /></h4>
                    <p className="text-zinc-700 text-lg font-bold italic bg-accent/5 p-8 rounded-[2rem] border-2 border-accent/10">"{request.goal}"</p>
                  </div>
                )}
                
                {/* تنبيه الدفع للمستفهم في حال القبول المباشر */}
                {isOwner && request.status === 'accepted' && (
                  <div className="bg-blue-50 p-10 rounded-[3rem] border-4 border-dashed border-blue-200 flex flex-col md:flex-row items-center justify-between gap-8 animate-in zoom-in duration-500">
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-2xl">
                        <CheckCircle2 /> <span>تم قبول طلبك!</span>
                      </div>
                      <p className="text-blue-700 font-bold text-lg">المفهم <span className="underline decoration-dotted">{request.mufhemName}</span> جاهز للبدء. يرجى إتمام الدفع لتفعيل المحاضرة.</p>
                    </div>
                    <Button onClick={() => goToCheckout()} className="h-20 px-12 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl shadow-2xl flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                      <CreditCard size={28}/> إتمام الدفع {request.amount} ج.م
                    </Button>
                  </div>
                )}

                {isOwner && request.status === 'paid' && (
                  <div className="bg-green-50 p-10 rounded-[3rem] border-4 border-dashed border-green-200 flex items-center justify-between animate-in fade-in">
                    <div className="text-right">
                      <h4 className="text-2xl font-black text-green-900 flex items-center gap-2">
                        <ShieldCheck className="text-green-600" /> المحاضرة مدفوعة وجاهزة!
                      </h4>
                      <p className="text-green-700 font-bold mt-1">يمكنك الآن الدخول لغرفة المحاضرة المباشرة مع المفهم.</p>
                    </div>
                    <Button onClick={() => router.push(`/meeting/${request.id}`)} className="h-20 px-12 rounded-[2rem] bg-green-600 hover:bg-green-700 font-black text-2xl shadow-xl transition-all hover:scale-105">
                      <Play className="ml-2 fill-current"/> دخول المحاضرة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* نموذج تقديم العروض للمفهمين */}
            {!isOwner && profile?.role === 'mufhem' && request.status === 'active' && (
              <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="p-8 border-b bg-muted/30 flex items-center gap-4">
                  <div className="bg-primary p-3 rounded-2xl text-white shadow-lg"><Zap size={24}/></div>
                  <h3 className="text-2xl font-black">تقدم للمشروع (قدم عرضك)</h3>
                </div>
                <CardContent className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="font-black text-lg">مدة التسليم (بالأيام)</Label>
                      <Input type="number" placeholder="مثال: 1" value={offerForm.duration} onChange={(e)=>setOfferForm({...offerForm, duration: e.target.value})} className="h-16 rounded-2xl border-2 font-black text-xl text-center" />
                    </div>
                    <div className="space-y-3">
                      <Label className="font-black text-lg">قيمة العرض (ج.م)</Label>
                      <Input type="number" placeholder="100" value={offerForm.amount} onChange={(e)=>setOfferForm({...offerForm, amount: e.target.value})} className="h-16 rounded-2xl border-2 font-black text-xl text-center" />
                      {offerForm.amount && (
                        <p className="text-xs text-green-600 font-bold text-center">ستستلم {Number(offerForm.amount) * 0.8} ج.م بعد خصم عمولة المنصة (20%)</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg">تفاصيل العرض</Label>
                    <Textarea placeholder="اشرح للمستفهم لماذا أنت الأنسب وماذا ستقدم له في المحاضرة..." value={offerForm.details} onChange={(e)=>setOfferForm({...offerForm, details: e.target.value})} className="h-48 rounded-[2rem] border-2 p-6 text-lg font-medium leading-relaxed" />
                  </div>
                  <Button onClick={handleSubmitOffer} disabled={isSubmittingOffer} className="w-full h-20 rounded-[2rem] font-black text-2xl shadow-2xl transition-all hover:scale-[1.01]">
                    {isSubmittingOffer ? <Loader2 className="animate-spin ml-2 h-8 w-8" /> : "إرسال العرض المتقدم الآن"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center font-bold italic">* يمنع منعاً باتاً تبادل وسائل تواصل خارجية؛ كافة التعاملات تتم داخل المنصة لضمان حقوقك.</p>
                </CardContent>
              </Card>
            )}

            {/* عرض العروض المتاحة لصاحب الطلب */}
            {isOwner && (
              <div className="space-y-8 animate-in fade-in">
                <h3 className="text-2xl font-black border-r-8 border-primary pr-6 flex items-center gap-3">العروض المتقدمة ({offers?.length || 0}) <Zap size={20} className="text-accent" /></h3>
                <div className="space-y-6">
                  {offers?.map((offer) => (
                    <Card key={offer.id} className={`rounded-[2.5rem] border-2 bg-white transition-all hover:border-primary/20 overflow-hidden ${offer.status === 'accepted' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'shadow-sm'}`}>
                      <CardContent className="p-8 flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex gap-6 items-start flex-1 text-right">
                          <Avatar className="h-20 w-20 shadow-xl border-4 border-white shrink-0"><AvatarImage src={offer.mufhemAvatar} /><AvatarFallback>{offer.mufhemName?.charAt(0)}</AvatarFallback></Avatar>
                          <div className="space-y-2">
                            <h4 className="font-black text-xl flex items-center gap-2">{offer.mufhemName} <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">خبير موثق</Badge></h4>
                            <p className="text-zinc-600 text-md font-medium leading-relaxed">"{offer.details}"</p>
                            <div className="flex gap-4 text-xs font-bold text-muted-foreground pt-2">
                              <span className="flex items-center gap-1"><Clock size={14}/> {offer.duration} يوم</span>
                              <span className="flex items-center gap-1"><BadgeCent size={14}/> {offer.amount} ج.م</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-center justify-center gap-4 bg-muted/20 p-6 rounded-3xl min-w-[180px]">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">قيمة العرض</p>
                            <h5 className="text-3xl font-black text-primary tabular-nums">{offer.amount} <span className="text-sm">ج.م</span></h5>
                          </div>
                          {(request.status === 'active' || request.status === 'accepted') && offer.status !== 'accepted' && (
                            <Button onClick={() => goToCheckout(offer.id)} className="w-full h-12 rounded-xl font-black bg-green-600 hover:bg-green-700 shadow-lg flex items-center gap-2">
                              <CreditCard size={16}/> قبول الدفع
                            </Button>
                          )}
                          {offer.status === 'accepted' && <Badge className="bg-green-100 text-green-600 h-10 px-6 rounded-xl font-black flex items-center gap-2"><CheckCircle2 size={16}/> تم القبول</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!offers || offers.length === 0) && (
                    <div className="py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-zinc-100 flex flex-col items-center gap-4">
                      <div className="bg-zinc-50 p-6 rounded-full"><Clock size={40} className="text-zinc-300" /></div>
                      <p className="font-black text-zinc-300 text-xl">بانتظار وصول عروض المفهمين الأولى...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl bg-white p-8 space-y-6 shadow-sm border-2">
              <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold text-sm">حالة الاستفهام</span><Badge className={request.status === 'paid' ? 'bg-green-100 text-green-600 border-none px-4' : 'bg-blue-100 text-blue-600 border-none px-4'}>{request.status === 'paid' ? 'مدفوع - جاهز' : request.status === 'accepted' ? 'بانتظار الدفع' : 'مفتوح للعروض'}</Badge></div>
              <div className="flex justify-between items-center pt-4 border-t border-dashed"><span className="text-zinc-500 font-bold text-sm">الميزانية المقترحة</span><span className="text-primary font-black text-3xl tabular-nums">{request.amount} <span className="text-sm">ج.م</span></span></div>
              <div className="flex justify-between items-center pt-4 border-t border-dashed"><span className="text-zinc-500 font-bold text-sm">الموعد المطلوب</span><span className="text-zinc-800 font-black text-xs text-left">{new Date(request.meetingTime).toLocaleString('ar-EG')}</span></div>
            </Card>

            <Card className="rounded-3xl bg-white overflow-hidden shadow-sm border-2">
              <div className="p-6 border-b bg-zinc-50/50 text-right"><h4 className="font-black text-zinc-800 flex items-center gap-2 justify-end"><User size={16}/> صاحب الاستفهام</h4></div>
              <CardContent className="p-8 flex items-center gap-4 justify-end">
                <div className="text-right">
                  <p className="font-black text-xl text-zinc-900 leading-none">{request.mustafhemName}</p>
                  <p className="text-xs text-zinc-400 font-bold mt-2">موثق في المنصة <ShieldCheck size={12} className="inline text-blue-500" /></p>
                </div>
                <Avatar className="h-16 w-16 border-4 border-zinc-50 shadow-md">
                  <AvatarImage src={owner?.profilePictureUrl} />
                  <AvatarFallback className="font-black text-xl">{request.mustafhemName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>

            {isOwner && request.status !== 'paid' && (
              <div className="p-6 bg-orange-50 rounded-3xl border-2 border-orange-200 flex items-start gap-4 text-orange-800 text-sm font-bold shadow-inner">
                <AlertCircle size={24} className="shrink-0 mt-1" />
                <p>تنبيه: يجب إتمام الدفع قبل 30 دقيقة على الأقل من موعد المحاضرة لضمان تأكيد الحجز وفتح غرفة الفيديو.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
