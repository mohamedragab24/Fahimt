
"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  Banknote, 
  ShieldCheck,
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  Phone
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, addDoc } from "firebase/firestore";
import { createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchParams } from "next/navigation";

type WithdrawalMethod = 'insta_pay' | 'e_wallet' | 'bank_transfer';

function WalletContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>('e_wallet');
  const [transferTarget, setTarget] = useState("");

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "transactions"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  const balance = transactions?.reduce((acc: number, tx: any) => {
    if (tx.status === 'rejected') return acc;
    if (tx.type === 'deposit' || tx.type === 'earning') return acc + tx.amount;
    return acc - tx.amount;
  }, 0) || 0;

  const handleTransaction = async () => {
    if (!firestore || !user || !amount || !profile) return;
    
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      toast({ variant: "destructive", title: "مبلغ غير صحيح" });
      return;
    }

    if (profile.role === 'mufhem') {
      if (numAmount > balance) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ" });
        return;
      }
      if (!transferTarget) {
        toast({ variant: "destructive", title: "يرجى تحديد رقم/عنوان التحويل" });
        return;
      }
      
      try {
        const txRef = await addDoc(collection(firestore, "users", user.uid, "transactions"), {
          amount: numAmount,
          type: 'withdrawal',
          details: `طلب سحب أرباح (${withdrawalMethod})`,
          status: 'pending',
          transferTarget,
          method: withdrawalMethod,
          timestamp: new Date().toISOString()
        });

        await addDoc(collection(firestore, "payoutRequests"), {
          userId: user.uid,
          userName: profile.fullName,
          userEmail: profile.email,
          phoneNumber: profile.phoneNumber,
          method: withdrawalMethod,
          transferTarget,
          amount: numAmount,
          status: 'pending',
          transactionId: txRef.id,
          timestamp: new Date().toISOString()
        });

        toast({ title: "تم تقديم طلب السحب بنجاح" });
      } catch (e) {
        toast({ variant: "destructive", title: "فشل العملية" });
      }
    } else {
      createTransactionNonBlocking(firestore, user.uid, {
        amount: numAmount,
        type: 'deposit',
        details: 'شحن رصيد المحفظة',
        status: 'completed'
      });
      toast({ title: "تم شحن الرصيد بنجاح" });
    }

    setIsModalOpen(false);
    setAmount("");
    setTarget("");
  };

  if (isLoading || !profile) return <div className="p-10 text-center font-bold">جاري تحميل المحفظة...</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-20" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-5xl font-black font-headline">محفظة فهمت</h1>
          <p className="text-muted-foreground text-xl">إدارة رصيدك والتحكم في أرباحك ومدفوعاتك.</p>
        </div>
        <div className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl font-black flex items-center gap-3">
          <ShieldCheck /> معاملات مؤمنة بالكامل
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 bg-zinc-900 text-white border-none shadow-2xl rounded-[3rem] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none rotate-12">
            <Wallet size={300} />
          </div>
          <div className="relative z-10 space-y-10">
            <div className="space-y-2">
              <span className="text-zinc-400 font-black text-xl">الرصيد المتاح</span>
              <div className="flex items-baseline gap-4">
                <span className="text-8xl font-black tabular-nums tracking-tighter">{balance}</span>
                <span className="text-3xl font-bold opacity-60">ج.م</span>
              </div>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90 px-12 py-10 rounded-3xl font-black text-2xl shadow-xl transition-all group">
                  {profile.role === 'mustafhem' ? <><Plus className="ml-3 h-8 w-8" /> إضافة رصيد</> : <><Download className="ml-3 h-8 w-8" /> سحب الأرباح</>}
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="rounded-[3rem] sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle className="text-right text-3xl font-black">{profile.role === 'mustafhem' ? 'شحن المحفظة' : 'سحب الأرباح'}</DialogTitle>
                  <DialogDescription className="text-right text-lg font-bold">حدد المبلغ وطريقة {profile.role === 'mustafhem' ? 'الدفع' : 'التحويل'}.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-8">
                  <div className="space-y-3">
                    <Label className="font-black text-xl">المبلغ (ج.م)</Label>
                    <Input type="number" placeholder="100" value={amount} onChange={(e)=>setAmount(e.target.value)} className="h-20 text-4xl font-black text-center rounded-3xl border-2" />
                  </div>

                  {profile.role === 'mufhem' && (
                    <div className="space-y-6">
                      <Label className="font-black text-xl">وسيلة السحب المتاحة</Label>
                      <RadioGroup value={withdrawalMethod} onValueChange={(v:any)=>setWithdrawalMethod(v)} className="grid grid-cols-1 gap-3">
                        <WithdrawMethodItem id="w1" val="e_wallet" label="محفظة إلكترونية" icon={Smartphone} />
                        <WithdrawMethodItem id="w2" val="insta_pay" label="إنستا باي (InstaPay)" icon={CheckCircle2} />
                        <WithdrawMethodItem id="w3" val="bank_transfer" label="تحويل بنكي" icon={Building2} />
                      </RadioGroup>
                      <div className="space-y-3">
                        <Label className="font-black">رقم المحفظة / عنوان إنستا باي / رقم الحساب</Label>
                        <Input value={transferTarget} onChange={(e)=>setTarget(e.target.value)} className="h-14 rounded-xl border-2 font-bold" placeholder="أدخل البيانات هنا..." />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter><Button onClick={handleTransaction} className="w-full py-10 text-2xl font-black rounded-3xl shadow-xl">تأكيد العملية</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        <Card className="shadow-2xl border-2 rounded-[3rem] p-8 flex flex-col justify-center bg-white space-y-8">
          <h3 className="text-2xl font-black text-primary border-r-4 border-primary pr-4">سياسة المالية</h3>
          <div className="space-y-6">
            <PolicyItem text="السحب متاح لمبالغ تبدأ من 50 ج.م" />
            <PolicyItem text="تتم مراجعة السحب خلال 24 ساعة عمل" />
            <PolicyItem text="المنصة تضمن حقوقك المالية بالكامل" />
          </div>
        </Card>
      </div>

      <div className="space-y-8 pt-10">
        <h2 className="text-3xl font-black flex items-center gap-3"><History className="text-primary"/> سجل المعاملات الأخيرة</h2>
        <Card className="shadow-2xl border-2 overflow-hidden rounded-[3rem] bg-white">
          <Table>
            <TableHeader className="bg-muted/30 h-16">
              <TableRow><TableHead className="text-right px-8 font-black">العملية</TableHead><TableHead className="text-right font-black">التاريخ</TableHead><TableHead className="text-right font-black">المبلغ</TableHead><TableHead className="text-right px-8 font-black">الحالة</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx: any) => (
                <TableRow key={tx.id} className="h-20 hover:bg-muted/5">
                  <TableCell className="px-8"><div className="flex items-center gap-4"><div className={`p-2 rounded-xl ${tx.type === 'deposit' || tx.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{tx.type === 'deposit' || tx.type === 'earning' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}</div><span className="font-bold">{tx.details}</span></div></TableCell>
                  <TableCell className="text-muted-foreground font-bold">{new Date(tx.timestamp).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className={`font-black text-2xl ${tx.type === 'deposit' || tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}{tx.amount} <span className="text-xs">ج.م</span></TableCell>
                  <TableCell className="px-8"><Badge className={tx.status === 'completed' ? 'bg-green-100 text-green-600' : tx.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}>{tx.status === 'completed' ? 'ناجحة' : tx.status === 'pending' ? 'بانتظار المراجعة' : 'مرفوضة'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function WithdrawMethodItem({ id, val, label, icon: Icon }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border-2 hover:bg-zinc-50 transition-all cursor-pointer">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-primary" />
        <Label htmlFor={id} className="font-black cursor-pointer">{label}</Label>
      </div>
      <RadioGroupItem value={val} id={id} />
    </div>
  );
}

function PolicyItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-zinc-600 font-bold">
      <div className="w-2 h-2 bg-primary rounded-full" />
      {text}
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">جاري التحميل...</div>}>
      <WalletContent />
    </Suspense>
  );
}
