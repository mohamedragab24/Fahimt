
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCent, Download, Plus, History, ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminFinance() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [amount, setAmount] = useState("");

  const handleSearch = async () => {
    if (!firestore || !searchId) return;
    const userRef = doc(firestore, "users", searchId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setTargetUser({ ...snap.data(), id: snap.id });
    } else {
      toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على مستخدم بهذا المعرف." });
      setTargetUser(null);
    }
  };

  const handleRecharge = async () => {
    if (!firestore || !targetUser || !amount) return;
    try {
      const txRef = collection(firestore, "users", targetUser.id, "transactions");
      await addDoc(txRef, {
        amount: Number(amount),
        type: 'deposit',
        details: 'شحن رصيد بواسطة الإدارة (فودافون كاش)',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      await addDoc(collection(firestore, "adminLogs"), {
        action: 'manual_recharge',
        targetUserId: targetUser.id,
        amount: Number(amount),
        timestamp: new Date().toISOString()
      });

      toast({ title: "تم الشحن!", description: `تم إضافة ${amount} ج.م لحساب ${targetUser.fullName}` });
      setAmount("");
      setTargetUser(null);
      setSearchId("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تنفيذ عملية الشحن" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex justify-between items-center gap-6 border-r-8 border-purple-500 pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">إدارة المالية</h1>
          <p className="text-muted-foreground text-lg">التحكم في المحافظ المالية وشحن الرصيد وسحب الأرباح.</p>
        </div>
      </div>

      <Tabs defaultValue="recharge" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-20 p-2 bg-muted/40 rounded-[2rem] mb-10">
          <TabsTrigger value="recharge" className="rounded-2xl text-xl font-bold flex gap-3">
            <Plus className="h-6 w-6" /> شحن رصيد يدوي
          </TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-2xl text-xl font-bold flex gap-3">
            <Download className="h-6 w-6" /> طلبات السحب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recharge">
          <Card className="max-w-3xl mx-auto shadow-2xl rounded-[3rem] overflow-hidden border-2">
            <CardHeader className="bg-purple-500 text-white p-10">
              <CardTitle className="text-3xl font-black flex items-center gap-4">
                <BadgeCent className="h-10 w-10" /> شحن محفظة مستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-lg font-bold">ID المستخدم أو البريد</Label>
                  <Input 
                    placeholder="أدخل المعرف هنا..." 
                    className="h-16 text-xl rounded-2xl border-2 px-6"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch} className="h-16 px-10 rounded-2xl font-black text-xl mt-8">
                  <Search className="h-6 w-6" />
                </Button>
              </div>

              {targetUser && (
                <div className="p-8 bg-green-50 rounded-[2rem] border-2 border-dashed border-green-200 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-6 mb-8">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={targetUser.profilePictureUrl} />
                      <AvatarFallback>{targetUser.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black">{targetUser.fullName}</h4>
                      <p className="text-green-700 font-bold">{targetUser.email}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-xl font-bold">المبلغ المراد شحنه (ج.م)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="h-20 text-4xl font-black text-center rounded-3xl border-2 border-green-200 focus:border-green-500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button onClick={handleRecharge} className="w-full h-16 text-2xl font-black rounded-2xl bg-green-600 hover:bg-green-700 mt-6">
                      تأكيد عملية الشحن الآن
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed">
            <History className="mx-auto h-20 w-20 opacity-20 mb-6" />
            <p className="text-2xl font-black text-muted-foreground">لا توجد طلبات سحب بانتظار المراجعة.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
