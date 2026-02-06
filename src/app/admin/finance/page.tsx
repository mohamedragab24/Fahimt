
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCent, Download, Plus, History, ArrowUpRight, ArrowDownLeft, Search, CheckCircle2, XCircle, Wallet, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminFinance() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [actionType, setActionType] = useState<'deposit' | 'withdrawal'>('deposit');

  const payoutQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "payoutRequests"), where("status", "==", "pending"), orderBy("timestamp", "desc"));
  }, [firestore]);

  const { data: payouts, isLoading: isLoadingPayouts } = useCollection(payoutQuery);

  const handleSearch = async () => {
    if (!firestore || !searchId) return;
    try {
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", searchId));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setTargetUser({ ...snap.docs[0].data(), id: snap.docs[0].id });
      } else {
        const userRef = doc(firestore, "users", searchId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setTargetUser({ ...userSnap.data(), id: userSnap.id });
        } else {
          toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على مستخدم." });
          setTargetUser(null);
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل البحث" });
    }
  };

  const handleManualAction = async () => {
    if (!firestore || !targetUser || !amount) return;
    try {
      const txRef = collection(firestore, "users", targetUser.id, "transactions");
      const numAmount = Number(amount);
      
      await addDoc(txRef, {
        amount: numAmount,
        type: actionType,
        details: actionType === 'deposit' ? 'شحن رصيد يدوي بواسطة الإدارة' : 'خصم رصيد يدوي بواسطة الإدارة',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      await addDoc(collection(firestore, "adminLogs"), {
        action: actionType === 'deposit' ? 'manual_recharge' : 'manual_deduction',
        targetUserId: targetUser.id,
        amount: numAmount,
        timestamp: new Date().toISOString()
      });

      toast({ 
        title: "تمت العملية!", 
        description: `تم ${actionType === 'deposit' ? 'إضافة' : 'خصم'} مبلغ ${amount} ج.م لحساب ${targetUser.fullName}` 
      });
      setAmount("");
      setTargetUser(null);
      setSearchId("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تنفيذ العملية" });
    }
  };

  const handlePayoutAction = async (payout: any, action: 'approve' | 'reject') => {
    if (!firestore) return;
    try {
      const payoutRef = doc(firestore, "payoutRequests", payout.id);
      await updateDoc(payoutRef, { status: action === 'approve' ? 'completed' : 'rejected' });
      
      if (action === 'approve') {
        await addDoc(collection(firestore, "users", payout.userId, "transactions"), {
          amount: payout.amount,
          type: 'withdrawal',
          details: 'تم تحويل أرباحك لمحفظتك بنجاح',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
        toast({ title: "تم التحويل", description: "تم تأكيد تحويل المبلغ للمستخدم." });
      } else {
        toast({ title: "تم الرفض", description: "تم رفض طلب السحب." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل معالجة الطلب" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex justify-between items-center border-r-8 border-purple-500 pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">إدارة المالية</h1>
          <p className="text-muted-foreground text-lg">التحكم في الأرصدة (شحن/خصم) وعمليات السحب.</p>
        </div>
      </div>

      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 p-1 bg-muted rounded-2xl mb-8">
          <TabsTrigger value="actions" className="rounded-xl text-lg font-bold">
            <Wallet className="h-5 w-5 ml-2" /> العمليات اليدوية
          </TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-xl text-lg font-bold">
            <Download className="h-5 w-5 ml-2" /> طلبات السحب ({payouts?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <Card className="max-w-3xl mx-auto shadow-xl rounded-[2.5rem] overflow-hidden border-2">
            <CardHeader className="bg-purple-600 text-white p-8">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <BadgeCent className="h-8 w-8" /> التحكم في رصيد المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="font-bold mb-2 block">البريد الإلكتروني أو User ID</Label>
                  <Input 
                    placeholder="مثال: name@example.com" 
                    className="h-14 rounded-xl text-lg"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch} className="h-14 px-8 rounded-xl bg-purple-600 mt-8">
                  <Search className="h-6 w-6" />
                </Button>
              </div>

              {targetUser && (
                <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-6 animate-in fade-in">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16 shadow-md border-2 border-white">
                      <AvatarImage src={targetUser.profilePictureUrl} />
                      <AvatarFallback>{targetUser.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xl font-black">{targetUser.fullName}</h4>
                      <p className="text-sm text-muted-foreground font-bold">{targetUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant={actionType === 'deposit' ? 'default' : 'outline'}
                      onClick={() => setActionType('deposit')}
                      className={`h-14 text-lg font-bold rounded-xl ${actionType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      <Plus className="ml-2 h-5 w-5" /> شحن رصيد
                    </Button>
                    <Button 
                      variant={actionType === 'withdrawal' ? 'destructive' : 'outline'}
                      onClick={() => setActionType('withdrawal')}
                      className="h-14 text-lg font-bold rounded-xl"
                    >
                      <MinusCircle className="ml-2 h-5 w-5" /> خصم رصيد
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="font-bold">المبلغ (ج.م)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="h-16 text-3xl font-black text-center rounded-2xl"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button 
                      onClick={handleManualAction} 
                      className={`w-full h-14 text-xl font-black rounded-xl ${actionType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      تأكيد عملية {actionType === 'deposit' ? 'الشحن' : 'الخصم'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="shadow-xl rounded-[2.5rem] overflow-hidden border-2">
            <Table>
              <TableHeader className="bg-muted/50 h-16">
                <TableRow>
                  <TableHead className="text-right px-8 font-black">المفهم</TableHead>
                  <TableHead className="text-right font-black">المبلغ</TableHead>
                  <TableHead className="text-right font-black">المحفظة</TableHead>
                  <TableHead className="text-right font-black">التاريخ</TableHead>
                  <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayouts ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold">جاري تحميل الطلبات...</TableCell></TableRow>
                ) : payouts?.map((p) => (
                  <TableRow key={p.id} className="h-20">
                    <TableCell className="px-8 font-bold">{p.userName}</TableCell>
                    <TableCell className="font-black text-purple-600">{p.amount} ج.م</TableCell>
                    <TableCell className="font-mono">{p.phoneNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(p.timestamp).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell className="px-8 text-left">
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => handlePayoutAction(p, 'approve')} size="sm" className="bg-green-600 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 ml-1" /> تم التحويل
                        </Button>
                        <Button onClick={() => handlePayoutAction(p, 'reject')} size="sm" variant="destructive" className="rounded-lg">
                          <XCircle className="h-4 w-4 ml-1" /> رفض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!payouts || payouts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-bold">
                      لا توجد طلبات سحب حالياً.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
