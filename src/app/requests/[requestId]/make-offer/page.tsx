
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { 
  Zap, 
  BadgeCent, 
  Clock, 
  Send, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileText,
  ShieldCheck,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة تقديم عرض مخصص - تتيح للمفهم إدخال تفاصيل عرضه التقنية والمالية.
 */
export default function MakeOfferPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    duration: "1",
    details: ""
  });

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId as string);
  }, [firestore, requestId]);

  const { data: request, isLoading: isRequestLoading } = useDoc(requestRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    // التأكد من أن المستخدم مفهم وموثق (اختياري حسب السياسة)
    if (profile && profile.role !== 'mufhem') {
      toast({ variant: "destructive", title: "تنبيه", description: "هذه الصفحة مخصصة للمفهمين فقط." });
      router.push('/');
    }
  }, [profile, router, toast]);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !request || !profile) return;

    if (!formData.amount || !formData.details) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تحديد السعر وتفاصيل العرض." });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. إضافة العرض لمجموعة العروض الفرعية للاستفهام
      await addDoc(collection(firestore, "istifhams", requestId as string, "offers"), {
        mufhemId: user.uid,
        mufhemName: profile.fullName,
        mufhemAvatar: profile.profilePictureUrl || "",
        amount: Number(formData.amount),
        duration: formData.duration,
        details: formData.details,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      // 2. إرسال إشعار لصاحب الطلب
      await addDoc(collection(firestore, "notifications"), {
        userId: request.mustafhemId,
        title: "عرض جديد على استفهامك!",
        message: `قام المفهم ${profile.fullName} بتقديم عرض لشرح: ${request.title}.`,
        type: "new_offer",
        read: false,
        requestId: requestId,
        createdAt: new Date().toISOString()
      });

      toast({ title: "تم إرسال عرضك بنجاح!", description: "ستتلقى إشعاراً فور قبول المستفهم لعرضك." });
      router.push(`/requests/${requestId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال العرض، يرجى المحاولة لاحقاً." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRequestLoading) return <div className="p-20 text-center animate-pulse font-black text-2xl">جاري تحميل تفاصيل الطلب...</div>;
  if (!request) return <div className="p-20 text-center font-bold text-red-500">عذراً، هذا الاستفهام غير موجود.</div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 mb-20" dir="rtl">
      <div className="flex items-center justify-between border-r-8 border-primary pr-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-headline">تقديم عرض تفهيم</h1>
          <p className="text-muted-foreground font-bold">أنت الآن تقدم عرضاً لشرح موضوع: <span className="text-primary">{request.title}</span></p>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl font-bold gap-2">
          <ChevronRight className="rotate-180" /> رجوع
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-8 border-b">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Edit3 className="text-primary" /> تفاصيل العرض الفني والمالي
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 md:p-10 space-y-8">
              <form onSubmit={handleSendOffer} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-black text-lg flex items-center gap-2">سعرك المقترح (ج.م) <BadgeCent size={18} className="text-green-600"/></Label>
                    <Input 
                      type="number" 
                      placeholder="مثال: 150"
                      className="h-16 rounded-2xl border-2 font-black text-2xl text-center shadow-inner"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground font-bold text-center">* تذكر: يتم استقطاع 20% عمولة للمنصة من هذا المبلغ.</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-black text-lg flex items-center gap-2">موعد التوافر (بالأيام) <Clock size={18} className="text-blue-600"/></Label>
                    <Input 
                      type="number" 
                      placeholder="خلال كم يوم؟"
                      className="h-16 rounded-2xl border-2 font-bold text-xl text-center"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-lg flex items-center gap-2">كيف ستشرح هذا الموضوع؟ <FileText size={18} className="text-primary"/></Label>
                  <Textarea 
                    placeholder="اشرح طريقتك في التفهيم، الأدوات التي ستستخدمها، وكيف ستضمن فهم المستفهم للمعلومة..."
                    className="h-48 rounded-[2rem] border-2 p-6 text-lg font-medium leading-relaxed"
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    required
                  />
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex items-start gap-4">
                  <ShieldCheck className="text-blue-600 shrink-0 mt-1" />
                  <p className="text-blue-800 text-sm font-bold leading-relaxed">
                    بتقديمك لهذا العرض، أنت تلتزم بالحضور في الموعد المحدد وتقديم شرح وافٍ يحقق هدف المستفهم.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary shadow-xl hover:scale-[1.02] transition-all"
                >
                  {isSubmitting ? <><Loader2 className="animate-spin ml-3" /> جاري الإرسال...</> : <><Send className="ml-3 rotate-180" /> إرسال العرض الآن</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] bg-zinc-900 text-white p-8 space-y-6 shadow-xl">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Zap className="text-primary fill-current" /> نصائح لعرض قوي
            </h3>
            <ul className="space-y-4">
              <TipItem text="كن دقيقاً في شرح مهاراتك المرتبطة بهذا الاستفهام تحديداً." />
              <TipItem text="السعر العادل يزيد من فرص قبول عرضك." />
              <TipItem text="أكد للمستفهم أنك لن تنهي الجلسة إلا بعد فهمه التام." />
              <TipItem text="راجع معرض أعمالك؛ فالطلاب ينظرون إليه قبل الاختيار." />
            </ul>
          </Card>

          <Card className="rounded-[2.5rem] border-2 border-dashed p-8 bg-white space-y-4">
            <h4 className="font-black text-zinc-800 flex items-center gap-2"><Info size={18} className="text-primary"/> معلومات الطلب</h4>
            <div className="space-y-2 text-sm font-bold text-zinc-500">
              <p>المستفهم: <span className="text-zinc-900">{request.mustafhemName}</span></p>
              <p>الميزانية المقترحة: <span className="text-primary">{request.amount} ج.م</span></p>
              <p>القسم: <span className="text-zinc-900">{request.category}</span></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="h-2 w-2 bg-primary rounded-full mt-2 shrink-0"></div>
      <p className="text-zinc-400 text-xs font-bold leading-relaxed">{text}</p>
    </li>
  );
}
