
"use client";

import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, addDoc, query, orderBy, updateDoc, getDoc } from "firebase/firestore";
import { 
  Clock, 
  User, 
  BadgeCent, 
  Calendar, 
  CheckCircle2, 
  Tag, 
  Briefcase,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Timer,
  ImageIcon,
  Mail,
  Phone,
  UserCircle,
  Target,
  FileText,
  Plus,
  Loader2,
  Star,
  Paperclip,
  DollarSign,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/ai/flows/messaging-flow";

export default function RequestDetailsPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleSubmitOffer = async () => {
    if (!firestore || !currentUser || !profile || !request) return;
    if (!offerForm.amount || !offerForm.duration || !offerForm.details) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة حقول العرض." });
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

      if (owner?.phoneNumber) {
        sendNotification({
          recipient: owner.phoneNumber,
          method: 'whatsapp',
          body: `أهلاً ${owner.fullName}، لقد تلقيت عرضاً جديداً من الخبير "${profile.fullName}" على استفهامك: "${request.title}". تفقد المنصة الآن لمراجعة العرض.`
        });
      }

      toast({ title: "تم تقديم العرض بنجاح", description: "سيتم إخطار صاحب الاستفهام بمراجعة عرضك." });
      setOfferForm({ amount: "", duration: "", details: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال العرض." });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    if (!firestore || !requestRef) return;
    try {
      await updateDoc(requestRef, {
        status: "accepted",
        mufhemId: offer.mufhemId,
        mufhemName: offer.mufhemName,
        amount: offer.amount,
        acceptedOfferId: offer.id,
        acceptedAt: new Date().toISOString()
      });

      await updateDoc(doc(firestore, "istifhams", request.id, "offers", offer.id), {
        status: "accepted"
      });

      toast({ title: "تم قبول العرض!", description: "تم حجز الخبير وجاري تحضير المحاضرة." });
      router.push(`/meeting/${request.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل قبول العرض." });
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-bold">جاري تحميل تفاصيل المشروع...</div>;
  if (!request) return <div className="p-20 text-center font-bold text-red-500">عذراً، هذا المشروع غير موجود.</div>;

  const earnings = Number(offerForm.amount) * 0.8;

  return (
    <div className="bg-zinc-50 min-h-screen pb-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 hover:bg-white gap-2 font-bold text-zinc-600"
        >
          <ChevronRight size={18} />
          العودة للقائمة
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-10 space-y-10">
                <div className="border-b pb-6 text-right flex justify-between items-center">
                  <h1 className="text-3xl font-black text-zinc-900">تفاصيل الاستفهام</h1>
                  <Badge variant="outline" className="text-primary font-black px-4 py-1">{request.category}</Badge>
                </div>

                <div className="space-y-8 text-right">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-primary">{request.title}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs justify-end">
                      {request.categorySub} <Tag size={12} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-black text-zinc-800 flex items-center gap-2 justify-end">
                      التفاصيل <FileText size={18} className="text-primary" />
                    </h4>
                    <p className="text-zinc-700 text-lg leading-relaxed whitespace-pre-wrap font-medium bg-zinc-50 p-8 rounded-[2rem] border-2 border-dashed">
                      {request.description}
                    </p>
                  </div>

                  {request.goal && (
                    <div className="space-y-4">
                      <h4 className="font-black text-zinc-800 flex items-center gap-2 justify-end">
                        هدف الاستفهام (شرط الاستحقاق) <Target size={18} className="text-accent" />
                      </h4>
                      <p className="text-zinc-700 text-lg leading-relaxed whitespace-pre-wrap font-bold italic bg-accent/5 p-8 rounded-[2rem] border-2 border-accent/10">
                        "{request.goal}"
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {profile?.role === 'mufhem' && request.status === 'active' && profile.id !== request.mustafhemId && (
              <Card className="rounded-xl border shadow-sm overflow-hidden bg-white animate-in slide-in-from-bottom-4">
                <div className="p-6 border-b bg-zinc-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-zinc-800">تقدم للمشروع</h3>
                </div>
                <CardContent className="p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <Label className="font-black text-zinc-700 block text-right">
                        مدة التسليم <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center">
                        <Input 
                          placeholder="مثال: 1" 
                          type="number"
                          className="h-14 rounded-l-none rounded-r-xl border-2 text-center font-black" 
                          value={offerForm.duration}
                          onChange={(e)=>setOfferForm({...offerForm, duration: e.target.value})}
                        />
                        <div className="h-14 bg-zinc-100 border-2 border-r-0 rounded-l-xl px-4 flex items-center justify-center font-bold text-zinc-500">أيام</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="font-black text-zinc-700 block text-right">
                        قيمة العرض <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center">
                        <Input 
                          placeholder="0.00" 
                          type="number"
                          className="h-14 rounded-l-none rounded-r-xl border-2 text-center font-black" 
                          value={offerForm.amount}
                          onChange={(e)=>setOfferForm({...offerForm, amount: e.target.value})}
                        />
                        <div className="h-14 bg-zinc-100 border-2 border-r-0 rounded-l-xl px-4 flex items-center justify-center font-bold text-zinc-500">
                          <DollarSign size={16} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="font-black text-zinc-700 block text-right">مستحقاتك</Label>
                      <div className="flex items-center">
                        <div className="h-14 rounded-l-none rounded-r-xl bg-zinc-100 border-2 flex-1 flex items-center justify-center font-black text-xl text-zinc-600">
                          {earnings.toFixed(0)}
                        </div>
                        <div className="h-14 bg-zinc-100 border-2 border-r-0 rounded-l-xl px-4 flex items-center justify-center font-bold text-zinc-500">
                          <DollarSign size={16} />
                        </div>
                      </div>
                      <p className="text-[10px] text-primary font-bold text-center mt-1">بعد خصم عمولة موقع مستقل</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-zinc-700 block text-right">
                      تفاصيل العرض <span className="text-red-500">*</span>
                    </Label>
                    <Textarea 
                      placeholder=""
                      className="h-48 rounded-xl border-2 p-6 text-lg font-medium leading-relaxed"
                      value={offerForm.details}
                      onChange={(e)=>setOfferForm({...offerForm, details: e.target.value})}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row items-end justify-between gap-6 pt-6">
                    <div className="space-y-4 w-full">
                      <Button variant="outline" className="gap-2 font-bold rounded-lg h-10 px-4 text-zinc-500 border-zinc-200">
                        <Paperclip size={16} /> أرفق ملفات (اختياري)
                      </Button>
                      <ul className="text-xs text-muted-foreground font-bold space-y-2 text-right">
                        <li className="flex items-center gap-2 justify-end">لا تستخدم وسائل تواصل خارجية <div className="w-1 h-1 bg-zinc-400 rounded-full"/></li>
                        <li className="flex items-center gap-2 justify-end">لا تضع روابط خارجية، قم بالاهتمام بمعرض أعمالك بدلاً منها <div className="w-1 h-1 bg-zinc-400 rounded-full"/></li>
                        <li className="flex items-center gap-2 justify-end"><span className="text-primary cursor-pointer hover:underline">اقرأ هنا كيف تضيف عرضاً مميزاً على أي مشروع</span> <div className="w-1 h-1 bg-zinc-400 rounded-full"/></li>
                      </ul>
                    </div>
                    <Button 
                      onClick={handleSubmitOffer} 
                      disabled={isSubmittingOffer}
                      className="h-14 px-12 rounded-lg font-black text-lg bg-[#1e6ca8] hover:bg-[#1e6ca8]/90 transition-all w-full md:w-auto"
                    >
                      {isSubmittingOffer ? <Loader2 className="animate-spin" /> : "أضف عرضك"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile?.id === request.mustafhemId && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-black border-r-8 border-primary pr-6 flex items-center gap-3">
                  العروض المقدمة <Badge className="bg-primary/10 text-primary border-none">{offers?.length || 0}</Badge>
                </h3>
                
                <div className="space-y-6">
                  {offers?.map((offer) => (
                    <Card key={offer.id} className={`rounded-[2rem] border-2 transition-all hover:border-primary/20 bg-white overflow-hidden ${offer.status === 'accepted' ? 'border-green-500 ring-4 ring-green-50' : ''}`}>
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                          <div className="flex gap-6 flex-1 text-right">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-lg shrink-0">
                              <AvatarImage src={offer.mufhemAvatar} />
                              <AvatarFallback>{offer.mufhemName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-3 justify-end md:justify-start">
                                <h4 className="font-black text-xl text-zinc-900">{offer.mufhemName}</h4>
                                <Badge variant="outline" className="text-[10px] font-bold">{offer.mufhemSpecialization}</Badge>
                                <div className="flex gap-0.5"><Star size={12} className="fill-yellow-400 text-yellow-400" /> <span className="text-[10px] font-black">5.0</span></div>
                              </div>
                              <p className="text-zinc-600 font-medium leading-relaxed bg-zinc-50/50 p-4 rounded-xl border italic">
                                "{offer.details}"
                              </p>
                              <div className="flex gap-6 text-[10px] font-bold text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock size={12} /> التسليم: {offer.duration} يوم</span>
                                <span className="flex items-center gap-1"><BadgeCent size={12} /> القيمة: {offer.amount} ج.م</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex flex-col justify-center items-center gap-4 border-r-2 md:pr-8 border-dashed">
                            <div className="text-center">
                              <p className="text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-widest">قيمة العرض</p>
                              <h5 className="text-3xl font-black text-primary">{offer.amount} <span className="text-sm">ج.م</span></h5>
                            </div>
                            {request.status === 'active' && (
                              <Button onClick={() => handleAcceptOffer(offer)} className="h-12 px-8 rounded-xl font-black bg-green-600 hover:bg-green-700 shadow-lg">
                                قبول العرض
                              </Button>
                            )}
                            {offer.status === 'accepted' && (
                              <Badge className="bg-green-100 text-green-600 font-black h-10 px-6 rounded-xl flex items-center gap-2">
                                <CheckCircle2 size={16} /> عرض مقبول
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!offers || offers.length === 0) && (
                    <div className="py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-zinc-100">
                      <MessageSquare size={64} className="mx-auto text-zinc-100 mb-4" />
                      <p className="text-xl font-black text-zinc-300">لا توجد عروض مقدمة بعد؛ سيتم إخطارك فور وصول أول عرض.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-none shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">حالة المشروع</span>
                    <Badge className={`${
                      request.status === 'active' ? 'bg-green-100 text-green-600' : 
                      request.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 
                      'bg-zinc-100 text-zinc-600'
                    } border-none px-3 font-black`}>
                      {request.status === 'active' ? 'مفتوح' : 
                       request.status === 'accepted' ? 'قيد التنفيذ' : 
                       request.status === 'completed' ? 'مكتمل' : 'بانتظار المراجعة'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">تاريخ النشر</span>
                    <span className="text-zinc-900 font-bold flex items-center gap-1.5">
                      <Clock size={14} /> {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">الميزانية المقترحة</span>
                    <span className="text-primary font-black text-lg">
                      {request.amount} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b bg-zinc-50/50 text-right">
                <h4 className="font-black text-zinc-800">صاحب الاستفهام</h4>
              </div>
              <CardContent className="p-6 space-y-6">
                <div 
                  className="flex items-center gap-4 cursor-pointer group justify-end"
                  onClick={() => setShowOwnerProfile(true)}
                >
                  <div className="text-right">
                    <p className="font-black text-zinc-900 flex items-center gap-1 group-hover:text-primary transition-colors justify-end">
                      {request.mustafhemName}
                      <ShieldCheck size={14} className="text-blue-500" />
                    </p>
                    <p className="text-xs text-zinc-500 font-bold">اضغط لعرض الملف</p>
                  </div>
                  <Avatar className="h-14 w-14 border-2 border-primary/10 group-hover:border-primary transition-all">
                    <AvatarImage src={owner?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                      {request.mustafhemName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showOwnerProfile} onOpenChange={setShowOwnerProfile}>
        <DialogContent className="rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-black flex items-center gap-3 justify-end">
              <UserCircle className="text-primary" /> ملف المستفهم
            </DialogTitle>
            <DialogDescription className="text-right">معلومات أساسية حول صاحب الاستفهام.</DialogDescription>
          </DialogHeader>
          {owner && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center gap-4 p-6 bg-muted/20 rounded-3xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={owner.profilePictureUrl} />
                  <AvatarFallback className="text-3xl font-black">{owner.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h4 className="text-2xl font-black">{owner.fullName}</h4>
                  <Badge className="mt-2">{owner.role === 'mufhem' ? 'مفهم' : 'مستفهم'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border text-right">
                  <span className="text-xs font-bold text-muted-foreground block">تاريخ الانضمام</span>
                  <span className="font-black">{new Date(owner.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border text-right">
                  <span className="text-xs font-bold text-muted-foreground block">الجنس</span>
                  <span className="font-black">{owner.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
