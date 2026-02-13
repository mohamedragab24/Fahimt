
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, ShieldCheck, User, Calendar, Clock, Star, ShieldAlert, Link as LinkIcon, BadgeCent, X, PlayCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminSessionsReview() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(userRef);

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const canReadSessions = adminProfile?.isAdmin || isMasterAdmin;

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !canReadSessions) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "in", ["accepted", "completed"])
    );
  }, [firestore, canReadSessions]);

  const { data: rawSessions, isLoading } = useCollection(sessionsQuery);

  const sessions = rawSessions?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // دالة ذكية للحصول على الرابط حتى لو لم يكن مسجلاً في قاعدة البيانات
  const getSessionUrl = (session: any) => {
    if (session?.recordingUrl) return session.recordingUrl;
    if (session?.id) {
      return `https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/Fahimni_Room_${session.id}`;
    }
    return null;
  };

  if (!canReadSessions && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لمركز الرقابة.</div>;
  }

  const activeUrl = getSessionUrl(selectedSession);

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-blue-600 pr-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">مركز رقابة المحاضرات</h1>
          <p className="text-muted-foreground text-lg">مراجعة الجلسات المباشرة لضمان أمان وخصوصية المستخدمين وحل النزاعات.</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-3 text-blue-700">
          <ShieldCheck />
          <span className="font-black">نظام حماية الطرفين (مراجعة داخلية)</span>
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black text-zinc-900">المحاضرة</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الأطراف</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الموعد والمبلغ</TableHead>
              <TableHead className="text-right font-black text-zinc-900">التقييم</TableHead>
              <TableHead className="text-left px-8 font-black text-zinc-900">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold animate-pulse">جاري تحميل البيانات...</TableCell></TableRow>
            ) : sessions?.map((session) => (
              <TableRow key={session.id} className="h-24 hover:bg-muted/5 transition-colors">
                <TableCell className="px-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-zinc-800">{session.title}</span>
                    <Badge variant="outline" className="w-fit text-[10px] mt-1">ID: {session.id.slice(-6)}</Badge>
                  </div>
                </TableCell>
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
                    variant="default" 
                    size="sm" 
                    className="rounded-xl gap-2 font-black shadow-lg bg-blue-600 hover:bg-blue-700" 
                    onClick={() => setSelectedSession(session)}
                  >
                    <PlayCircle size={16} /> مراجعة المحاضرة
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

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[1100px] h-[85vh] p-0 overflow-hidden bg-black border-none rounded-[2.5rem] shadow-2xl" dir="rtl">
          <DialogHeader className="p-6 bg-zinc-900 text-white border-b border-zinc-800 flex flex-row justify-between items-center space-y-0">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Video className="text-blue-500" /> مراجعة محتوى المحاضرة: {selectedSession?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-zinc-950 relative flex items-center justify-center">
            {activeUrl ? (
              <iframe 
                src={activeUrl} 
                className="absolute inset-0 w-full h-full border-none"
                allow="autoplay; fullscreen; microphone; camera; display-capture"
                title="Recording Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center space-y-6">
                <div className="bg-zinc-900 p-8 rounded-full border-2 border-dashed border-zinc-700">
                  <ShieldAlert size={80} className="text-zinc-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">رابط التسجيل غير متوفر</h3>
                  <p className="text-zinc-400 font-bold text-lg max-w-md">عذراً، لم يتم العثور على سجل لهذه المحاضرة.</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedSession(null)} className="rounded-xl border-zinc-700 text-white hover:bg-white hover:text-black font-black px-10">إغلاق المعاينة</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-8 bg-zinc-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="bg-blue-500/20 p-6 rounded-full shrink-0">
          <ShieldAlert size={48} className="text-blue-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black">إرشادات الرقابة الإدارية</h3>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-3xl text-sm">
            يتم حفظ المحاضرات صوت وصورة لضمان حق الطالب في الفهم وحق المعلم في الأجر. في حال وجود أي نزاع مالي أو شكوى فنية، سيقوم النظام بعرض التسجيل كاملاً لمراجعته واتخاذ القرار المناسب.
          </p>
        </div>
      </div>
    </div>
  );
}
