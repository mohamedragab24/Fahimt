
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, ShieldCheck, User, Calendar, Clock, Star, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminSessionsReview() {
  const firestore = useFirestore();

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "in", ["accepted", "completed"]),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: sessions, isLoading } = useCollection(sessionsQuery);

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-blue-600 pr-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black font-headline">مركز رقابة المحاضرات</h1>
          <p className="text-muted-foreground text-lg">مراجعة الجلسات المباشرة (صوت وصورة) لضمان أمان وخصوصية المستخدمين.</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-3 text-blue-700">
          <ShieldCheck />
          <span className="font-black">نظام حماية الطرفين مفعل</span>
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black">المحاضرة</TableHead>
              <TableHead className="text-right font-black">الأطراف</TableHead>
              <TableHead className="text-right font-black">الحالة الأمنية</TableHead>
              <TableHead className="text-right font-black">التقييم</TableHead>
              <TableHead className="text-left px-8 font-black">الرقابة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold">جاري تحميل البيانات...</TableCell></TableRow>
            ) : sessions?.map((session) => (
              <TableRow key={session.id} className="h-24 hover:bg-muted/5 transition-colors">
                <TableCell className="px-8 font-bold text-lg">{session.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span className="font-bold text-primary">المستفهم: {session.mustafhemName}</span>
                    <span className="font-bold text-accent">المفهم: {session.mufhemName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-600 border-none font-black px-4 py-1">
                    <ShieldCheck size={14} className="ml-1" /> مشفرة
                  </Badge>
                </TableCell>
                <TableCell>
                  {session.rating ? (
                    <div className="flex items-center gap-1 text-yellow-500 font-black">
                      <Star size={16} className="fill-current" /> {session.rating}.0
                    </div>
                  ) : <span className="text-muted-foreground italic text-xs">بانتظار التقييم</span>}
                </TableCell>
                <TableCell className="px-8 text-left">
                  <Badge variant="outline" className="h-10 px-4 rounded-xl border-2 cursor-pointer hover:bg-primary/5 transition-all">
                    <Video size={16} className="ml-2 text-primary" /> مراجعة الأرشيف
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="p-8 bg-zinc-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="bg-blue-500/20 p-6 rounded-full">
          <ShieldAlert size={48} className="text-blue-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black">سياسة الخصوصية والرقابة</h3>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-3xl">
            يتم الاحتفاظ بسجلات الجلسات لأغراض الرقابة فقط وحل النزاعات المالية أو الأخلاقية. 
            يضمن النظام عدم وصول أي طرف ثالث لهذه البيانات خارج الفريق الإداري المخول.
          </p>
        </div>
      </div>
    </div>
  );
}
