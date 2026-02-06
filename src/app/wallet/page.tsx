
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, Banknote } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";

export default function WalletPage() {
  const { user } = useUser();
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };

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

  const balance = transactions?.reduce((acc: number, tx: any) => acc + (tx.type === 'deposit' || tx.type === 'earning' ? tx.amount : -tx.amount), 0) || 0;

  if (isLoading) return <div className="p-10 text-center font-bold">جاري تحميل بيانات المحفظة...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-headline">المحفظة</h1>
          <p className="text-muted-foreground">إدارة أموالك وتتبع معاملاتك المالية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-accent text-white border-none shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet size={120} />
          </div>
          <CardHeader>
            <CardTitle className="text-xl opacity-90">رصيدك الحالي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-5xl font-black">{balance} <span className="text-2xl font-normal opacity-80">ج.م</span></div>
            <div className="flex gap-4">
              {profile?.role === 'mustafhem' ? (
                <Button className="bg-white text-primary hover:bg-white/90 px-8 py-6 rounded-xl font-bold text-lg shadow-lg">
                  <Plus className="mr-2 h-6 w-6" /> إضافة رصيد
                </Button>
              ) : (
                <Button className="bg-white text-accent hover:bg-white/90 px-8 py-6 rounded-xl font-bold text-lg shadow-lg">
                  <ArrowUpRight className="mr-2 h-6 w-6" /> طلب سحب
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5 text-accent" />
              {profile?.role === 'mufhem' ? 'بيانات السحب' : 'بيانات الشحن'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl space-y-2 border border-dashed">
              <span className="text-xs text-muted-foreground uppercase font-bold">رقم المحفظة الإلكترونية</span>
              <p className="font-mono text-lg font-bold">{profile?.phoneNumber || "غير مسجل"}</p>
            </div>
            <p className="text-xs text-muted-foreground">يتم التحويل عبر فودافون كاش، اتصالات كاش، أو أورانج كاش.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-headline flex items-center gap-2">
          <History className="h-5 w-5" /> سجل المعاملات
        </h2>
        <Card className="shadow-sm overflow-hidden">
          <Table dir="rtl">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === 'deposit' || tx.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'deposit' || tx.type === 'earning' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      {tx.details}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className={`font-bold ${tx.type === 'deposit' || tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'deposit' || tx.type === 'earning' ? `+${tx.amount}` : `-${tx.amount}`} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">مكتمل</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!transactions || transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    لا توجد معاملات مالية حتى الآن
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
