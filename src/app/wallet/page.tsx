"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, Banknote, Landmark } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WalletPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);

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

  const balance = transactions?.reduce((acc: number, tx: any) => 
    acc + (tx.type === 'deposit' || tx.type === 'earning' ? tx.amount : -tx.amount), 0) || 0;

  const handleDeposit = () => {
    if (!firestore || !user || !depositAmount) return;
    
    createTransactionNonBlocking(firestore, user.uid, {
      amount: Number(depositAmount),
      type: 'deposit',
      details: 'شحن رصيد المحفظة (تجريبي)',
      status: 'completed'
    });

    setIsDepositOpen(false);
    setDepositAmount("");
    toast({
      title: "تم طلب الشحن",
      description: "سيتم إضافة الرصيد لمحفظتك فور تأكيد العملية.",
    });
  };

  if (isLoading) return <div className="p-10 text-center font-bold">جاري تحميل بيانات المحفظة...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-headline">المحفظة المالية</h1>
          <p className="text-muted-foreground text-lg">إدارة أموالك وتتبع معاملاتك المالية بكل شفافية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-accent text-white border-none shadow-2xl overflow-hidden relative rounded-[2rem]">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Wallet size={160} />
          </div>
          <CardHeader className="pt-10 px-10">
            <CardTitle className="text-2xl opacity-90 font-bold">إجمالي الرصيد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-10 px-10 pb-12">
            <div className="text-7xl font-black tabular-nums">{balance} <span className="text-3xl font-normal opacity-80">ج.م</span></div>
            <div className="flex gap-4">
              <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-primary hover:bg-gray-100 px-10 py-8 rounded-2xl font-bold text-xl shadow-xl transition-all hover:scale-105">
                    <Plus className="ml-2 h-7 w-7" /> {profile?.role === 'mustafhem' ? 'شحن رصيد' : 'طلب سحب'}
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right text-2xl font-bold">
                      {profile?.role === 'mustafhem' ? 'شحن رصيد المحفظة' : 'سحب الأرباح'}
                    </DialogTitle>
                    <DialogDescription className="text-right text-lg">
                      أدخل المبلغ المراد {profile?.role === 'mustafhem' ? 'شحنه' : 'سحبه'} عبر المحفظة الإلكترونية.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-lg">المبلغ (ج.م)</Label>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        value={depositAmount} 
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="h-14 text-xl font-bold"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleDeposit} className="w-full py-7 text-xl font-bold rounded-2xl">
                      تأكيد العملية
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-10 py-8 rounded-2xl font-bold text-xl">
                <Landmark className="ml-2 h-7 w-7" /> الحساب البنكي
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-2 rounded-[2rem] flex flex-col justify-center p-4">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3 font-bold">
              <Banknote className="h-6 w-6 text-accent" />
              بيانات الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted/30 rounded-2xl space-y-3 border border-dashed border-primary/30">
              <span className="text-sm text-muted-foreground font-bold block">رقم فودافون كاش المسجل</span>
              <p className="font-mono text-2xl font-black text-primary tracking-wider">{profile?.phoneNumber || "غير مسجل"}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              * يتم تنفيذ عمليات السحب والإيداع يدوياً خلال 24 ساعة من طلب العملية.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-black font-headline flex items-center gap-3 border-r-8 border-primary pr-4">
          <History className="h-8 w-8 text-primary" /> سجل المعاملات
        </h2>
        <Card className="shadow-xl border-2 overflow-hidden rounded-[2rem]">
          <Table dir="rtl">
            <TableHeader className="bg-muted/50">
              <TableRow className="h-16">
                <TableHead className="text-right text-lg font-bold">التفاصيل</TableHead>
                <TableHead className="text-right text-lg font-bold">التاريخ</TableHead>
                <TableHead className="text-right text-lg font-bold">المبلغ</TableHead>
                <TableHead className="text-right text-lg font-bold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.map((tx: any) => (
                <TableRow key={tx.id} className="h-20 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-bold text-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${tx.type === 'deposit' || tx.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'deposit' || tx.type === 'earning' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                      </div>
                      <div className="flex flex-col">
                        <span>{tx.details}</span>
                        <span className="text-xs text-muted-foreground font-normal">معرف المعاملة: {tx.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-md font-medium">
                    {new Date(tx.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </TableCell>
                  <TableCell className={`font-black text-xl ${tx.type === 'deposit' || tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'deposit' || tx.type === 'earning' ? `+${tx.amount}` : `-${tx.amount}`} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-sm font-bold">مكتمل</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!transactions || transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24 text-muted-foreground text-xl">
                    لا توجد معاملات مالية حتى الآن.. ابدأ أولى خطواتك التعليمية!
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