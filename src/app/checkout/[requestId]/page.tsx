
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
  ArrowRight,
  FileText,
  Download,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRefund, setAgreedRefund] = useState(false);
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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

    if (!agreedTerms || !agreedRefund) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب الموافقة على الشروط وسياسة الاسترجاع للمتابعة." });
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'wallet' && walletBalance < amountToPay) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "يرجى شحن محفظتك أو اختيار وسيلة دفع أخرى." });
        setIsProcessing(false);
        return;
      }

      const timestamp = new Date().toISOString();
      const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

      // تسجيل المعاملة
      const txRef = await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        amount: amountToPay,
        type: 'payment',
        details: `دفع مقابل استفهام: ${request.title}`,
        status: 'completed',
        method: paymentMethod,
        invoiceNumber,
        timestamp
      });

      const updateData: any = {
        status: "paid",
        paidAt: timestamp,
        paymentMethod: paymentMethod,
        finalAmount: amountToPay,
        invoiceNumber
      };

      if (offer) {
        updateData.mufhemId = offer.mufhemId;
        updateData.mufhemName = offer.mufhemName;
        updateData.amount = offer.amount;
        updateData.acceptedOfferId = offer.id;
        await updateDoc(offerRef!, { status: "accepted" });
      }

      await updateDoc(requestRef!, updateData);

      // تجهيز بيانات الفاتورة للعرض
      setInvoiceData({
        number: invoiceNumber,
        date: new Date().toLocaleDateString('ar-EG'),
        customerName: user.displayName || "عميل فهمت",
        customerEmail: user.email,
        customerPhone: phone || "غير مسجل",
        productName: request.title,
        price: amountToPay,
        method: paymentMethod === 'wallet' ? 'محفظة الموقع' : paymentMethod === 'e-wallet' ? 'محفظة إلكترونية' : 'بطاقة بنكية',
        status: 'مدفوع'
      });

      toast({ title: "تم الدفع بنجاح!" });
      setShowInvoice(true);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الدفع" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isRequestLoading || (offerId && isOfferLoading)) {
    return <div className="p-20 text-center animate-pulse font-black">جاري تحضير بوابة الدفع...</div>;
  }

  // عرض الفاتورة بعد النجاح
  if (showInvoice && invoiceData) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10" dir="rtl">
        <div className="text-center space-y-4">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-xl mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-black text-zinc-900">تمت العملية بنجاح!</h1>
          <p className="text-muted-foreground font-bold">شكراً لثقتك في منصة فهمت. إليك تفاصيل فاتورتك.</p>
        </div>

        <Card className="rounded-[3rem] shadow-2xl border-4 border-zinc-100 bg-white overflow-hidden print:border-none print:shadow-none">
          <div className="p-8 md:p-12 space-y-10">
            <div className="flex justify-between items-start border-b pb-8">
              <div className="text-right space-y-1">
                <h2 className="text-3xl font-black text-primary">فاتورة إلكترونية</h2>
                <p className="text-zinc-400 font-bold">رقم الفاتورة: {invoiceData.number}</p>
                <p className="text-zinc-400 font-bold">التاريخ: {invoiceData.date}</p>
              </div>
              <div className="text-2xl font-black text-zinc-800">فهمت.</div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-right">
              <div>
                <Label className="text-zinc-400 font-black text-xs uppercase">بيانات العميل</Label>
                <p className="font-black text-lg">{invoiceData.customerName}</p>
                <p className="text-sm font-bold text-zinc-500">{invoiceData.customerEmail}</p>
                <p className="text-sm font-bold text-zinc-500">{invoiceData.customerPhone}</p>
              </div>
              <div className="text-left">
                <Label className="text-zinc-400 font-black text-xs uppercase">حالة الدفع</Label>
                <Badge className="bg-green-100 text-green-600 text-lg px-6 py-1 block w-fit mr-auto font-black">{invoiceData.status}</Badge>
                <p className="text-xs font-bold text-zinc-400 mt-2">وسيلة الدفع: {invoiceData.method}</p>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-6">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-zinc-400 text-xs font-black uppercase border-b border-zinc-200">
                    <th className="pb-4">الخدمة / المنتج</th>
                    <th className="pb-4 text-left">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-lg font-black text-zinc-800">
                    <td className="py-6">{invoiceData.productName}</td>
                    <td className="py-6 text-left">{invoiceData.price} ج.م</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary">
                    <td className="pt-6 font-black text-2xl text-primary">الإجمالي النهائي</td>
                    <td className="pt-6 text-left font-black text-3xl text-primary">{invoiceData.price} ج.م</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-center pt-8 opacity-50 space-y-2">
              <p className="text-xs font-bold italic">هذه الفاتورة صدرت إلكترونياً وتعتبر مستنداً رسمياً لعملية الشراء.</p>
              <p className="text-[10px] font-black">شركة فهمت للتعلم الذكي - مصر</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button onClick={() => window.print()} variant="outline" className="flex-1 h-16 rounded-2xl font-black text-lg gap-2">
            <Printer size={20} /> طباعة الفاتورة
          </Button>
          <Button onClick={() => router.push(`/meeting/${requestId}`)} className="flex-1 h-16 rounded-2xl font-black text-lg bg-primary shadow-xl">
            الانتقال للمحاضرة الآن <ArrowRight size={20} className="mr-2 rotate-180" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10 bg-zinc-50 min-h-screen" dir="rtl">
      <div className="flex items-center justify-between border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-headline text-zinc-900">إتمام الدفع الآمن</h1>
          <p className="text-muted-foreground font-bold">اختر الوسيلة المناسبة لحجز جلستك التعليمية.</p>
        </div>
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
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-black text-zinc-900">الإجمالي</span>
                  <span className="text-3xl font-black text-primary">{amountToPay} <span className="text-sm">ج.م</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
            <CardContent className="p-8 md:p-12 space-y-10">
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-1 gap-4">
                <div 
                  className={`flex items-center justify-between p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Wallet className="text-primary" />
                    <div>
                      <Label htmlFor="wallet" className="text-xl font-black cursor-pointer">محفظة الموقع</Label>
                      <p className={`text-sm font-bold ${walletBalance >= amountToPay ? 'text-green-600' : 'text-red-500'}`}>رصيدك الحالي: {walletBalance} ج.م</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`flex flex-col gap-6 p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${paymentMethod === 'e-wallet' ? 'border-primary bg-primary/5' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                  onClick={() => setPaymentMethod('e-wallet')}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="e-wallet" id="e-wallet" />
                    <Smartphone className="text-green-600" />
                    <Label htmlFor="e-wallet" className="text-xl font-black cursor-pointer">محافظ إلكترونية (فودافون كاش)</Label>
                  </div>
                  {paymentMethod === 'e-wallet' && (
                    <Input 
                      placeholder="أدخل رقم المحفظة 01xxxxxxxxx" 
                      className="h-14 rounded-xl border-2 bg-white font-black text-xl text-center"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  )}
                </div>

                <div 
                  className={`flex flex-col gap-6 p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="text-blue-600" />
                    <Label htmlFor="card" className="text-xl font-black cursor-pointer">بطاقة بنكية (Visa/Mastercard)</Label>
                  </div>
                </div>
              </RadioGroup>

              {/* بنود الموافقة القانونية */}
              <div className="space-y-4 p-6 bg-zinc-50 rounded-3xl border-2 border-dashed">
                <div className="flex items-start gap-3">
                  <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(v) => setAgreedTerms(!!v)} className="mt-1" />
                  <Label htmlFor="terms" className="text-sm font-bold leading-relaxed cursor-pointer">
                    أوافق على <Link href="/terms" className="text-primary hover:underline">الشروط والأحكام</Link> الخاصة بالمنصة.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="refund" checked={agreedRefund} onCheckedChange={(v) => setAgreedRefund(!!v)} className="mt-1" />
                  <Label htmlFor="refund" className="text-sm font-bold leading-relaxed cursor-pointer">
                    أوافق على <Link href="/refund-policy" className="text-primary hover:underline">سياسة الاسترجاع</Link> (14 يوماً وفق القانون المصري).
                  </Label>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  disabled={isProcessing || !agreedTerms || !agreedRefund} 
                  onClick={handlePayment}
                  className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary shadow-2xl hover:scale-[1.02] transition-all"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <><Lock className="ml-3 h-6 w-6" /> إتمام الدفع الآن</>}
                </Button>
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
    <Suspense fallback={<div className="p-20 text-center animate-pulse">جاري تحميل صفحة الدفع...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
