
"use client";

import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { 
  Clock, 
  User, 
  BadgeCent, 
  Calendar, 
  CheckCircle2, 
  Target, 
  FileText, 
  Loader2, 
  Zap, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة تفاصيل الاستفهام المحدثة.
 * تعرض كافة التفاصيل للمستفهم مع زر الدفع البارز فور قبول الطلب.
 */
export default function RequestDetailsPage() {
  const params = useParams();
  const requestId = params?.requestId as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

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

  if (isLoading) return (
    <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4 bg-white min-h-screen" dir="rtl">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
      <p className="font-black text-2xl">جاري تحميل تفاصيل الاستفهام...</p>
    </div>
  );

  if (!request) return <div className="p-20 text-center font-bold text-red-500">الاستفهام غير موجود.</div>;

  const isOwner = currentUser?.uid === request.mustafhemId;
  const isMufhem = currentUser?.uid === request.mufhemId;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-white gap-2 font-black text-zinc-500">
            <ChevronRight size={20} className="rotate-180" /> العودة للاستفهامات
          </Button>
          <Badge className={`px-6 py-2 rounded-xl text-md font-black shadow-sm ${
            request.status === 'paid' ? 'bg-green-100 text-green-600' : 
            request.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {request.status === 'paid' ? 'مدفوع وجاهز' : request.status === 'accepted' ? 'بانتظار الدفع' : 'مفتوح للعروض'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* بطاقة تفاصيل الطلب الرئيسية */}
            <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-10 md:p-14 space-y-12">
                <div className="space-y-4 text-right">
                  <div className="flex items-center gap-3 justify-end mb-2">
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black">{request.category}</span>
                    <span className="text-zinc-400 text-xs font-bold flex items-center gap-1"><Clock size={14}/> منذ {new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight">
                    {request.title}
                  </h1>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 justify-end text-zinc-400 font-black text-xs uppercase tracking-widest">
                    <span>تفاصيل الاستفهام</span>
                    <FileText size={18} />
                  </div>
                  <div className="text-xl text-zinc-700 leading-relaxed font-medium bg-zinc-50/50 p-10 rounded-[2.5rem] border-2 border-dashed border-zinc-100">
                    {request.description}
                  </div>
                </div>

                {request.goal && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 justify-end text-accent font-black text-xs uppercase tracking-widest">
                      <span>الهدف المرجو تحقيقه</span>
                      <Target size={18} />
                    </div>
                    <div className="text-xl text-zinc-800 font-black italic bg-accent/5 p-10 rounded-[2.5rem] border-2 border-accent/10 border-dashed">
                      "{request.goal}"
                    </div>
                  </div>
                )}

                {/* قسم الدفع الفوري (يظهر للمستفهم عند القبول) */}
                {isOwner && request.status === 'accepted' && (
                  <div className="relative group animate-in slide-in-from-bottom-6 duration-700">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-primary rounded-[4rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-white border-4 border-blue-500/20 p-10 md:p-14 rounded-[3.5rem] shadow-2xl flex flex-col items-center text-center space-y-8">
                      <div className="bg-blue-100 w-24 h-24 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-inner">
                        <ShieldCheck size={56} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl md:text-4xl font-black text-zinc-900">جاهز لبدء التعلم؟</h3>
                        <p className="text-xl text-zinc-500 font-bold max-w-lg mx-auto">
                          لقد قبل المفهم <span className="text-blue-600 underline decoration-dotted">{request.mufhemName}</span> طلبك. يرجى تأمين الرصيد لتفعيل غرفة المحاضرة.
                        </p>
                      </div>
                      
                      <div className="w-full max-w-md p-6 bg-zinc-50 rounded-[2rem] border-2 border-dashed flex justify-between items-center px-10">
                        <span className="text-zinc-400 font-black text-sm uppercase">إجمالي المطلوب</span>
                        <span className="text-4xl font-black text-primary">{request.amount} <span className="text-lg">ج.م</span></span>
                      </div>

                      <Button 
                        onClick={() => goToCheckout()} 
                        className="w-full h-24 rounded-[2.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-4"
                      >
                        <CreditCard size={32} /> إتمام الدفع وفتح المحاضرة
                      </Button>
                      
                      <p className="text-xs text-zinc-400 font-bold flex items-center gap-2">
                        <AlertCircle size={14} /> سيتم حجز المبلغ في المنصة ولن يصل للمفهم إلا بعد تأكيد فهمك.
                      </p>
                    </div>
                  </div>
                )}

                {/* زر الدخول للمحاضرة (بعد الدفع) */}
                {(isOwner || isMufhem) && request.status === 'paid' && (
                  <div className="bg-green-50 p-12 rounded-[3.5rem] border-4 border-dashed border-green-200 flex flex-col items-center text-center space-y-8 animate-in zoom-in">
                    <div className="bg-white p-6 rounded-full shadow-xl text-green-600">
                      <Zap size={48} className="fill-current" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black text-green-900">المحاضرة مدفوعة وجاهزة!</h4>
                      <p className="text-lg text-green-700 font-bold">تم تأمين الرصيد بنجاح. اضغط أدناه للدخول للغرفة المباشرة.</p>
                    </div>
                    <Button 
                      onClick={() => router.push(`/meeting/${request.id}`)} 
                      className="h-20 px-16 rounded-[2rem] bg-green-600 hover:bg-green-700 font-black text-2xl shadow-2xl shadow-green-600/20 transition-all hover:scale-105"
                    >
                      دخول المحاضرة الآن
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* بطاقة معلومات سريعة */}
            <Card className="rounded-[2.5rem] bg-white p-8 space-y-8 shadow-xl border-none">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-black text-xs uppercase tracking-widest">الميزانية</span>
                  <span className="text-primary font-black text-4xl tabular-nums">{request.amount} <span className="text-sm">ج.م</span></span>
                </div>
                <div className="pt-6 border-t border-dashed space-y-2 text-right">
                  <span className="text-zinc-400 font-black text-xs uppercase tracking-widest block mb-2">الموعد المطلوب</span>
                  <div className="flex items-center gap-3 justify-end text-zinc-800 font-black">
                    <Calendar size={18} className="text-primary" />
                    <span className="text-lg">{new Date(request.meetingTime).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-3 justify-end text-zinc-500 font-bold mr-7">
                    <Clock size={16} />
                    <span>الساعة {new Date(request.meetingTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* بطاقة صاحب الطلب */}
            <Card className="rounded-[2.5rem] bg-white overflow-hidden shadow-xl border-none">
              <div className="p-6 border-b bg-zinc-50/50 text-right">
                <h4 className="font-black text-zinc-800 flex items-center gap-2 justify-end">
                  <User size={18} className="text-primary" /> صاحب الاستفهام
                </h4>
              </div>
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-2xl">
                  <AvatarImage src={owner?.profilePictureUrl} />
                  <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{request.mustafhemName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-black text-2xl text-zinc-900 leading-none">{request.mustafhemName}</p>
                  <p className="text-xs text-zinc-400 font-bold mt-2 flex items-center justify-center gap-1">
                    موثق في المنصة <ShieldCheck size={14} className="text-blue-500" />
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* بطاقة الأمان */}
            <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12">
                <BadgeCent size={120} />
              </div>
              <h4 className="text-xl font-black flex items-center gap-2 relative z-10">ضمان فهمني <ShieldCheck size={24} className="text-primary" /></h4>
              <p className="text-zinc-400 font-bold text-sm leading-relaxed relative z-10">
                أموالك في أمان تام؛ حيث لا يتم تحويل المستحقات للمفهم إلا بعد انتهاء الجلسة وتأكيدك بأنك "فهمت" المعلومة تماماً.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
