
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, Banknote } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WalletPage() {
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const balance = 1250;

  const transactions = [
    { id: "1", type: "deposit", amount: 500, date: "2024-05-18", status: "completed", desc: "شحن رصيد - فودافون كاش" },
    { id: "2", type: "payment", amount: -150, date: "2024-05-17", status: "completed", desc: "دفع قيمة جلسة كيمياء" },
    { id: "3", type: "withdrawal", amount: -200, date: "2024-05-15", status: "pending", desc: "طلب سحب أرباح" },
    { id: "4", type: "earning", amount: 400, date: "2024-05-14", status: "completed", desc: "أرباح جلسة برمجة" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-headline">المحفظة</h1>
          <p className="text-muted-foreground">إدارة أموالك وتتبع معاملاتك المالية</p>
        </div>
        <Button variant="outline" onClick={() => setRole(role === 'student' ? 'teacher' : 'student')}>
          تبديل (لمشاهدة واجهة المفهم/المستفهم)
        </Button>
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
              {role === 'student' ? (
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
              {role === 'teacher' ? 'بيانات السحب' : 'بيانات الشحن'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl space-y-2 border border-dashed">
              <span className="text-xs text-muted-foreground uppercase font-bold">رقم المحفظة الإلكترونية</span>
              <p className="font-mono text-lg font-bold">01012345678</p>
            </div>
            <p className="text-xs text-muted-foreground">يتم التحويل عبر فودافون كاش، اتصالات كاش، أو أورانج كاش.</p>
            <Button variant="link" className="p-0 text-primary h-auto">تعديل بيانات التحويل</Button>
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
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      {tx.desc}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                  <TableCell className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'completed' ? 'secondary' : 'outline'}>
                      {tx.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
