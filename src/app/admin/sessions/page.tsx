
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, ShieldCheck, User, Calendar, Clock, Star, ShieldAlert, Link as LinkIcon, BadgeCent, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminSessionsReview() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(userRef);

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const canReadSessions = adminProfile?.isAdmin || isMasterAdmin;

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !canReadSessions) return null;
    // جلب الجلسات التي بدأت بالفعل أو انتهت
    return query(
      collection(firestore, "istifhams"), 
      where("status", "in", ["accepted", "completed"])
    );
  }, [firestore, canReadSessions]);

  const { data: rawSessions, isLoading } = useCollection(sessionsQuery);

  // ترتيب يدوي في الواجهة لضمان جودة العرض دون خطأ فهرس
  const sessions = rawSessions?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!canReadSessions && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لمركز الرقابة.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-blue-600 pr-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">مركز رقابة المحاضرات</h1>
          <p className="text-muted-foreground text-lg">مراجعة الجلسات المباشرة لضمان أمان وخصوصية المستخدمين وحل النزاعات.</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-3 text-blue-700">
          <ShieldCheck />
          <span className="font-black">نظام حماية الطرفين (صوت وصورة)</span>
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black text-zinc-900">المحاضرة</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الأطراف</TableHead>
              <TableHead className="text-right font-black text-zinc-900">التاريخ والمبلغ</TableHead>
              <TableHead className="text-right font-black text-zinc-900">التقييم</TableHead>
              <TableHead className="text-left px-8 font-black text-zinc-900">الأرشيف (صوت وصورة)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold animate-pulse">جاري تحميل البيانات...</TableCell></TableRow>
            ) : sessions?.map((session) => (
              <TableRow key={session.id} className="h-24 hover:bg-muted/5 transition-colors">
                <TableCell className="px-8 font-bold text-lg text-zinc-800">{session.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm space-y-1">
                    <span className="font-bold text-primary flex items-center gap-1"><User size={14}/> {session.mustafhemName}</span>
                    <span className="font-bold text-accent flex items-center gap-1"><ShieldCheck size={14}/> {session.mufhemName || 'بانتظار مفهم'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs font-bold space-y-1">
                    <span className="flex items-center gap-1 text-muted-foreground"><Calendar size={12}/> {new Date(session.createdAt).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-1 text-primary"><BadgeCent size={12}/> {session.amount} ج.م</span>
                  </div>
                </TableCell>
                <TableCell>
                  {session.rating ? (
                    <div className="flex items-center gap-1 text-yellow-500 font-black">
                      <Star size={16} className="fill-current" /> {session.rating}.0
                    </div>
                  ) : <span className="text-muted-foreground italic text-xs font-bold">بانتظار التقييم</span>}
                </TableCell>
                <TableCell className="px-8 text-left">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl border-2 gap-2 font-black hover:bg-blue-50 text-blue-600 border-blue-100" 
                    onClick={() => setSelectedRecording(session.recordingUrl || null)}
                  >
                    <Video size={16} /> مراجعة التسجيل
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!sessions || sessions.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-black opacity-30 text-xl">لا توجد محاضرات مسجلة حالياً.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* مودال مراجعة التسجيل داخل المنصة */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[1100px] h-[85vh] p-0 overflow-hidden bg-black border-none rounded-[2.5rem] shadow-2xl" dir="rtl">
          <DialogHeader className="p-6 bg-zinc-900 text-white border-b border-zinc-800 flex flex-row justify-between items-center space-y-0">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Video className="text-blue-500" /> مراجعة تسجيل المحاضرة (صوت وصورة)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-zinc-950 relative">
            {selectedRecording ? (
              <iframe 
                src={selectedRecording} 
                className="absolute inset-0 w-full h-full border-none"
                allow="autoplay; fullscreen; microphone; camera; display-capture"
                title="Recording Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                <ShieldAlert size={64} />
                <p className="text-xl font-bold">عذراً، لا يتوفر رابط تسجيل لهذه المحاضرة حالياً.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-8 bg-zinc-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="bg-blue-500/20 p-6 rounded-full">
          <ShieldAlert size={48} className="text-blue-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black">إرشادات الرقابة الإدارية</h3>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-3xl text-sm">
            يتم تخزين روابط التسجيل لكل محاضرة مكتملة بشكل تلقائي. في حال وجود نزاع، يجب على المسؤول مراجعة التسجيل الصوتي والمرئي بالكامل للتحقق من جودة الشرح والالتزام بالقواعد الأخلاقية والمهنية قبل اتخاذ أي إجراء إداري أو مالي.
          </p>
        </div>
      </div>
    </div>
  );
}
