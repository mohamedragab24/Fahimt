
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  Banknote, 
  Landmark,
  ShieldCheck,
  CreditCard,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, addDoc } from "firebase/firestore";
import { createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function WalletPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  const transactionsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "transactions");
  }, [firestore, user]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!transactionsRef) return null;
    return query(transactionsRef, orderBy("timestamp", "desc"));
  }, [transactionsRef]);

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
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إدخال مبلغ صحيح." });
      return;
    }

    const isTeacher = profile.role === 'mufhem';
    
    if (isTeacher) {
      if (numAmount > balance) {
        toast({ 
          variant: "destructive", 
          title: "المبلغ غير متوفر", 
          description: "عذراً، رصيدك الحالي أقل من المبلغ الذي تحاول سحبه." 
        });
        return;
      }
      
      try {
        const txRef = await addDoc(collection(firestore, "users", user.uid, "transactions"), {
          amount: numAmount,
          type: 'withdrawal',
          details: 'طلب سحب أرباح',
          status: 'pending',
          timestamp: new Date().toISOString()
        });

        await addDoc(collection(firestore, "payoutRequests"), {
          userId: user.uid,
          userName: profile.fullName,
          userEmail: profile.email,
          phoneNumber: profile.phoneNumber,
          amount: numAmount,
          status: 'pending',
          transactionId: txRef.id,
          timestamp: new Date().toISOString()
        });

        toast({
          title: "تم تقديم الطلب",
          description: `تم خصم ${numAmount} ج.م من رصيدك مؤقتاً لحين مراجعة التحويل.`,
        });
      } catch (e) {
        toast({ variant: "destructive", title: "خطأ", description: "فشلت العملية، يرجى المحاولة لاحقاً." });
      }
    } else {
      createTransactionNonBlocking(firestore, user.uid, {
        amount: numAmount,
        type: 'deposit',
        details: 'شحن رصيد المحفظة',
        status: 'completed'
      });
      toast({
        title: "تم شحن الرصيد",
        description: `تم إضافة ${numAmount} ج.م لمحفظتك بنجاح وتظهر الآن في سجل المعاملات.`,
      });
    }

    setIsModalOpen(false);
    setAmount("");
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري تحميل بيانات المحفظة...</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 border-r-8 border-primary pr-6">
          <h1 className="text-5xl font-black font-headline tracking-tight">المحفظة</h1>
          <p className="text-muted-foreground text-xl">إدارة أرباحك ومدفوعاتك التعليمية بكل شفافية.</p>
        </div>
        <div className="flex items-center gap-3 bg-green-100 text-green-700 px-6 py-3 rounded-2xl font-black text-lg shadow-sm">
          <ShieldCheck size={24} />
          معاملات آمنة 100%
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-accent text-white border-none shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden relative rounded-[3rem]">
          <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none">
            <Wallet size={200} />
          </div>
          <CardHeader className="pt-12 px-12">
            <CardTitle className="text-2xl opacity-90 font-bold flex items-center gap-3">
              <CreditCard size={28} /> الرصيد المتاح
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-12 px-12 pb-16">
            <div className="flex items-baseline gap-4">
              <span className="text-8xl font-black tabular-nums tracking-tighter">{balance}</span>
              <span className="text-4xl font-bold opacity-80">ج.م</span>
            </div>
            
            <div className="flex flex-wrap gap-6 relative z-10">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-primary hover:bg-gray-100 px-14 py-10 rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                    {profile?.role === 'mustafhem' ? (
                      <><Plus className="ml-3 h-8 w-8 group-hover:rotate-90 transition-transform" /> إضافة رصيد</>
                    ) : (
                      <><Download className="ml-3 h-8 w-8" /> طلب سحب أرباح</>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="rounded-[2.5rem] sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-right text-3xl font-black mb-2">
                      {profile?.role === 'mustafhem' ? 'شحن المحفظة' : 'سحب الأرباح'}
                    </DialogTitle>
                    <DialogDescription className="text-right text-lg">
                      {profile?.role === 'mustafhem' 
                        ? 'أدخل المبلغ المراد شحنه عبر فودافون كاش أو أي محفظة إلكترونية.' 
                        : 'سيتم مراجعة طلب السحب وتحويل المبلغ لرقمك خلال 24 ساعة.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-8 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xl font-bold">المبلغ المطلوب (ج.م)</Label>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-20 text-4xl font-black text-center rounded-3xl border-2 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleTransaction} className="w-full py-10 text-2xl font-black rounded-3xl shadow-xl">
                      تأكيد العملية الآن
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-2 rounded-[3rem] p-4 flex flex-col justify-center bg-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-4 font-black text-primary">
              <Banknote className="h-8 w-8" />
              بيانات التحويل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="p-8 bg-muted/30 rounded-[2rem] space-y-4 border-2 border-dashed border-primary/20">
              <span className="text-sm text-muted-foreground font-black block">رقم المحفظة الإلكترونية</span>
              <p className="font-mono text-3xl font-black text-primary tracking-[0.2em]">{profile?.phoneNumber || "غير مسجل"}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                السحب متاح لمبالغ فوق 50 ج.م
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                التحويل يتم خلال 24 ساعة عمل
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <h2 className="text-4xl font-black font-headline flex items-center gap-4 border-r-8 border-primary pr-6">
          <History className="h-10 w-10 text-primary" /> سجل المعاملات
        </h2>
        
        <Card className="shadow-2xl border-2 overflow-hidden rounded-[3rem] bg-white">
          <Table dir="rtl">
            <TableHeader className="bg-muted/30 h-20">
              <TableRow className="border-none">
                <TableHead className="text-right text-xl font-black px-10">العملية</TableHead>
                <TableHead className="text-right text-xl font-black">التاريخ</TableHead>
                <TableHead className="text-right text-xl font-black">المبلغ</TableHead>
                <TableHead className="text-right text-xl font-black px-10">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.map((tx: any) => (
                <TableRow key={tx.id} className="h-28 hover:bg-primary/5 transition-colors border-b border-dashed">
                  <TableCell className="font-black text-xl px-10">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl shadow-sm ${tx.type === 'deposit' || tx.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'deposit' || tx.type === 'earning' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="leading-none">{tx.details}</span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">REF: {tx.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-lg font-bold">
                    {new Date(tx.timestamp).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell className={`font-black text-3xl tabular-nums ${tx.type === 'deposit' || tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'deposit' || tx.type === 'earning' ? `+${tx.amount}` : `-${tx.amount}`}
                    <span className="text-sm mr-2">ج.م</span>
                  </TableCell>
                  <TableCell className="px-10">
                    <div className="flex items-center gap-2">
                      <Badge className={`px-6 py-2 text-md font-black rounded-xl border-none ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        tx.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.status === 'completed' ? 'ناجحة' : tx.status === 'pending' ? 'قيد المراجعة' : 'مرفوضة'}
                      </Badge>
                      {tx.status === 'rejected' && tx.details?.includes('مرفوض:') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-bold">{tx.details}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!transactions || transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-32 text-muted-foreground text-2xl font-black opacity-30">
                    <div className="flex flex-col items-center gap-6">
                      <History size={80} />
                      سجل المعاملات فارغ حالياً
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
