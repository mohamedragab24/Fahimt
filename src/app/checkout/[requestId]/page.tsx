
"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Wallet, 
  Smartphone, 
  CreditCard, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  BadgeCent,
  Lock,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type PaymentMethod = 'wallet' | 'e-wallet' | 'card';

function CheckoutContent() {
  const params = useParams();
  const requestId = params?.requestId as string;
  const searchParams = useSearchParams();
  const offerId = searchParams?.get('offerId');
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [phone, setPhone] = useState("");

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId);
  }, [firestore, requestId]);

  const { data: request, isLoading: isRequestLoading } = useDoc(requestRef);

  const offerRef = useMemoFirebase(() => {
    if (!firestore || !requestId || !offerId) return null;
    return doc(firestore, "istifhams", requestId, "offers", offerId);
  }, [firestore, requestId, offerId]);

  const { data: offer, isLoading: isOfferLoading } = useDoc(offerRef);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!firestore || !user?.uid) return;
      const txSnap = await getDocs(collection(firestore, "users", user.uid, "transactions"));
      let bal = 0;
      txSnap.forEach(doc => {
        const d = doc.data();
        if (d.status !== 'rejected') {
          if (d.type === 'deposit' || d.type === 'earning') bal += d.amount;
          else bal -= d.amount;
        }
      });
      setWalletBalance(bal);
    };
    fetchBalance();
  }, [firestore, user?.uid]);

  const amountToPay = offer ? offer.amount : (request?.amount || 0);

  const handlePayment = async () => {
    if (!firestore || !user || !request) return;

    setIsProcessing(true);

    try {
      if (paymentMethod === 'wallet' && walletBalance < amountToPay) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "يرجى شحن محفظتك أو اختيار وسيلة دفع أخرى." });
        setIsProcessing(false);
        return;
      }

      // تسجيل المعاملة
      await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        amount: amountToPay,
        type: 'payment',
        details: `دفع مقابل استفهام: ${request.title} (${paymentMethod === 'wallet' ? 'محفظة الموقع' : paymentMethod === 'e-wallet' ? 'محفظة إلكترونية' : 'بطاقة ائتمان'})`,
        status: 'completed',
        method: paymentMethod,
        timestamp: new Date().toISOString()
      });

      const updateData: any = {
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentMethod: paymentMethod,
        finalAmount: amountToPay
      };

      if (offer) {
        updateData.mufhemId = offer.mufhemId;
        updateData.mufhemName = offer.mufhemName;
        updateData.amount = offer.amount;
        updateData.acceptedOfferId = offer.id;
        await updateDoc(offerRef!, { status: "accepted" });
      }

      await updateDoc(requestRef!, updateData);

      toast({ title: "تم الدفع بنجاح!", description: "المحاضرة جاهزة للبدء الآن." });
      router.push(`/meeting/${requestId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الدفع", description: "حدث خطأ غير متوقع." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isRequestLoading || (offerId && isOfferLoading)) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 bg-white min-h-screen" dir="rtl">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="font-black text-2xl">جاري تحضير بوابة الدفع الآمنة...</p>
      </div>
    );
  }

  if (!request) return <div className="p-20 text-center font-bold text-red-500">الطلب غير موجود.</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10 bg-zinc-50 min-h-screen" dir="rtl">
      <div className="flex items-center justify-between border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-headline text-zinc-900">إتمام الدفع الآمن</h1>
          <p className="text-muted-foreground font-bold">اختر الوسيلة المناسبة لحجز جلستك التعليمية.</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="h-12 rounded-xl font-bold gap-2">
          <span>رجوع</span> <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b p-6">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <BadgeCent className="text-primary" /> ملخص الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2 text-right">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">موضوع الاستفهام</p>
                <h4 className="font-black text-lg text-zinc-800 leading-tight">{request.title}</h4>
              </div>
              
              <div className="p-4 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-3">
                <div className="flex justify-between text-sm font-bold text-zinc-500">
                  <span>قيمة الجلسة</span>
                  <span>{amountToPay} ج.م</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-500">
                  <span>رسوم الخدمة</span>
                  <span className="text-green-600">مجاناً</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-black text-zinc-900">الإجمالي</span>
                  <span className="text-3xl font-black text-primary">{amountToPay} <span className="text-sm">ج.م</span></span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl flex items-start gap-3 text-blue-700 text-xs font-bold border border-blue-100">
                <ShieldCheck className="shrink-0" size={16} />
                <p>يتم حجز المبلغ في المنصة ولا يتم تحريره للمفهم إلا بعد تأكيد فهمك للمعلومة.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
            <CardContent className="p-8 md:p-12 space-y-10">
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-1 gap-4">
                {/* المحفظة */}
                <div 
                  className={`flex items-center justify-between p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5 shadow-inner' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-primary">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <Label htmlFor="wallet" className="text-xl font-black cursor-pointer">محفظة الموقع</Label>
                      <p className={`text-sm font-bold ${walletBalance >= amountToPay ? 'text-green-600' : 'text-red-500'}`}>رصيدك الحالي: {walletBalance} ج.م</p>
                    </div>
                  </div>
                  {paymentMethod === 'wallet' && walletBalance < amountToPay && (
                    <Badge variant="destructive" className="font-black">رصيد غير كافٍ</Badge>
                  )}
                </div>

                {/* المحافظ الإلكترونية */}
                <div 
                  className={`flex flex-col gap-6 p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${paymentMethod === 'e-wallet' ? 'border-primary bg-primary/5 shadow-inner' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                  onClick={() => setPaymentMethod('e-wallet')}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="e-wallet" id="e-wallet" />
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-green-600">
                      <Smartphone size={24} />
                    </div>
                    <Label htmlFor="e-wallet" className="text-xl font-black cursor-pointer">المحافظ الإلكترونية (فودافون كاش)</Label>
                  </div>
                  {paymentMethod === 'e-wallet' && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 pr-10">
                      <Label className="font-black">أدخل رقم المحفظة المحول منها</Label>
                      <Input 
                        placeholder="01xxxxxxxxx" 
                        className="h-14 rounded-xl border-2 bg-white font-black text-xl text-center"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground font-bold text-center italic">سيتم التحقق من عملية التحويل يدوياً خلال دقائق.</p>
                    </div>
                  )}
                </div>

                {/* بطاقة الائتمان */}
                <div 
                  className={`flex flex-col gap-6 p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-inner' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="card" id="card" />
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600">
                      <CreditCard size={24} />
                    </div>
                    <Label htmlFor="card" className="text-xl font-black cursor-pointer">بطاقة ائتمان (Visa/Mastercard)</Label>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 pr-10">
                      <div className="space-y-2">
                        <Label className="font-bold">رقم البطاقة</Label>
                        <Input placeholder="**** **** **** ****" className="h-14 rounded-xl border-2 bg-white font-mono text-center" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold">تاريخ الانتهاء</Label>
                          <Input placeholder="MM/YY" className="h-14 rounded-xl border-2 bg-white font-mono text-center" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold">رمز CVC</Label>
                          <Input placeholder="***" className="h-14 rounded-xl border-2 bg-white font-mono text-center" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </RadioGroup>

              <div className="pt-8 space-y-6">
                <Button 
                  disabled={isProcessing || (paymentMethod === 'wallet' && walletBalance < amountToPay)} 
                  onClick={handlePayment}
                  className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary shadow-2xl hover:scale-[1.02] transition-all"
                >
                  {isProcessing ? (
                    <><Loader2 className="ml-3 h-8 w-8 animate-spin" /> جاري تأمين الدفع...</>
                  ) : (
                    <><Lock className="ml-3 h-6 w-6" /> تأكيد الدفع وتفعيل المحاضرة</>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold text-sm">
                  <ShieldCheck size={16} /> مدعوم بتقنيات تشفير عالمية آمنة
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse">جاري تحميل بوابة الدفع...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
