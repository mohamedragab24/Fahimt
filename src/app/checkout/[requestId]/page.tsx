"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRefund, setAgreedRefund] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId);
  }, [firestore, requestId]);

  const { data: request, isLoading: isRequestLoading } = useDoc(requestRef);

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

  const amountToPay = request?.amount || 0;

  const handlePayment = async () => {
    if (!firestore || !user || !request) return;
    if (!agreedTerms || !agreedRefund) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب الموافقة على الشروط وسياسة الاسترجاع للمتابعة." });
      return;
    }

    setIsProcessing(true);
    try {
      const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      await updateDoc(requestRef!, { status: "paid", invoiceNumber });
      
      setInvoiceData({
        number: invoiceNumber,
        date: new Date().toLocaleDateString('ar-EG'),
        customerName: user.displayName || "عميل فهمت",
        productName: request.title,
        price: amountToPay,
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

  if (isRequestLoading) return <div className="p-20 text-center animate-pulse font-black">جاري التحميل...</div>;
  if (!request) return <div className="p-20 text-center font-bold text-red-500">الاستفهام غير موجود.</div>;

  if (showInvoice && invoiceData) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10" dir="rtl">
        <Card className="rounded-[3rem] shadow-2xl border-4 bg-white overflow-hidden p-8 md:p-12 space-y-10">
          <div className="flex justify-between items-start border-b pb-8">
            <h2 className="text-3xl font-black text-primary">فاتورة إلكترونية</h2>
            <div className="text-2xl font-black">فهمت.</div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-right">
            <div>
              <Label className="text-zinc-400 font-black text-xs uppercase">العميل</Label>
              <p className="font-black text-lg">{invoiceData.customerName}</p>
            </div>
            <div className="text-left">
              <Badge className="bg-green-100 text-green-600 text-lg px-6 py-1 font-black">مدفوع</Badge>
            </div>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-6">
            <table className="w-full text-right">
              <tbody>
                <tr className="text-lg font-black text-zinc-800">
                  <td className="py-6">{invoiceData.productName}</td>
                  <td className="py-6 text-left">{invoiceData.price} ج.م</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button onClick={() => router.push(`/meeting/${requestId}`)} className="w-full h-16 rounded-2xl font-black text-lg bg-primary">الانتقال للمحاضرة الآن</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10" dir="rtl">
      <h1 className="text-3xl font-black text-right">إتمام الدفع الآمن</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="rounded-[2.5rem] shadow-xl bg-white p-6 space-y-6">
          <h4 className="font-black text-lg text-zinc-800">{request.title}</h4>
          <div className="pt-3 border-t flex justify-between items-center">
            <span className="text-3xl font-black text-primary">{amountToPay} ج.م</span>
            <span className="font-black">الإجمالي</span>
          </div>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] shadow-2xl bg-white p-8 md:p-12 space-y-10 text-right">
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid gap-4">
              <div className={cn("p-6 rounded-[2rem] border-4 cursor-pointer", paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-zinc-100 bg-zinc-50')}>
                <Label className="text-xl font-black cursor-pointer">محفظة الموقع (رصيدك: {walletBalance} ج.م)</Label>
              </div>
            </RadioGroup>
            <div className="space-y-4 p-6 bg-zinc-50 rounded-3xl border-2 border-dashed">
              <div className="flex items-start gap-3 flex-row-reverse">
                <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(v) => setAgreedTerms(!!v)} />
                <Label htmlFor="terms" className="text-sm font-bold text-right">أوافق على الشروط والأحكام</Label>
              </div>
              <div className="flex items-start gap-3 flex-row-reverse">
                <Checkbox id="refund" checked={agreedRefund} onCheckedChange={(v) => setAgreedRefund(!!v)} />
                <Label htmlFor="refund" className="text-sm font-bold text-right">أوافق على سياسة الاسترجاع</Label>
              </div>
            </div>
            <Button disabled={isProcessing} onClick={handlePayment} className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary">الدفع الآن</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse">جاري التحميل...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
