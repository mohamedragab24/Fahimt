
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, ShieldCheck, User, Calendar, Clock, Star, ShieldAlert, BadgeCent, PlayCircle, FileText } from "lucide-react";
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
    // جلب كافة المحاضرات التي تم قبولها أو اكتمالها للمراجعة
    return query(
      collection(firestore, "istifhams"), 
      where("status", "in", ["accepted", "completed"])
    );
  }, [firestore, canReadSessions]);

  const { data: rawSessions, isLoading } = useCollection(sessionsQuery);

  const sessions = rawSessions?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!canReadSessions && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لمركز الرقابة.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-blue-600 pr-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">سجلات الرقابة الإدارية</h1>
          <p className="text-muted-foreground text-lg">مراجعة المحاضرات صوت وصورة والتقييمات المسجلة لحفظ الحقوق.</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-3 text-blue-700">
          <ShieldCheck />
          <span className="font-black">نظام الرقابة بالفيديو مفعل</span>
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black text-zinc-900">المحاضرة</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الأطراف</TableHead>
              <TableHead className="text-right font-black text-zinc-900">المبلغ</TableHead>
              <TableHead className="text-right font-black text-zinc-900">التقييم</TableHead>
              <TableHead className="text-left px-8 font-black text-zinc-900">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold animate-pulse">جاري جلب السجلات...</TableCell></TableRow>
            ) : sessions?.map((session) => (
              <TableRow key={session.id} className="h-24 hover:bg-muted/5 transition-colors">
                <TableCell className="px-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-zinc-800">{session.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {session.id.slice(-6)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm space-y-1">
                    <span className="font-bold text-primary flex items-center gap-1"><User size={14}/> {session.mustafhemName}</span>
                    <span className="font-bold text-accent flex items-center gap-1"><ShieldCheck size={14}/> {session.mufhemName || 'بانتظار المفهم'}</span>
                  </div>
                </TableCell>
                <TableCell className="font-black text-primary">{session.amount} ج.م</TableCell>
                <TableCell>
                  {session.rating ? (
                    <div className="flex items-center gap-1 text-yellow-500 font-black">
                      <Star size={16} className="fill-current" /> {session.rating}.0
                    </div>
                  ) : <span className="text-muted-foreground italic text-xs font-bold">لم تقيم بعد</span>}
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
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-black opacity-30 text-xl">لا توجد محاضرات في الأرشيف حالياً.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
              <ShieldCheck className="text-primary h-8 w-8" /> تقرير المحاضرة
            </DialogTitle>
            <DialogDescription className="text-right">مراجعة أحداث الجلسة صوت وصورة والتقييم النهائي.</DialogDescription>
          </DialogHeader>
          
          <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-zinc-50 rounded-2xl border flex items-center gap-4">
                <User className="text-primary" />
                <div><span className="text-[10px] block font-black">المستفهم</span><span className="font-bold">{selectedSession?.mustafhemName}</span></div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border flex items-center gap-4">
                <ShieldCheck className="text-accent" />
                <div><span className="text-[10px] block font-black">المفهم</span><span className="font-bold">{selectedSession?.mufhemName}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-black flex items-center gap-3 text-blue-600"><Video /> تسجيل المحاضرة (صوت وصورة)</h4>
              <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl">
                {/* مشغل فيديو مدمج يعرض رابط الغرفة أو التسجيل */}
                <iframe 
                  src={selectedSession?.recordingUrl || `https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/Fahimni_Room_${selectedSession?.id}#config.startWithAudioMuted=true&config.startWithVideoMuted=true`} 
                  className="w-full h-full border-none"
                  allow="autoplay; fullscreen; microphone; camera; display-capture"
                />
              </div>
              <p className="text-xs text-muted-foreground font-bold text-center italic">
                ملاحظة: إذا كانت المحاضرة منتهية، سيقوم النظام بمحاولة استرجاع سجل الأحداث صوت وصورة للمراجعة.
              </p>
            </div>

            <div className="p-8 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-4">
              <h4 className="text-xl font-black flex items-center gap-3"><Star className="text-yellow-500 fill-yellow-500" /> تقييم الطالب</h4>
              {selectedSession?.rating ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`h-6 w-6 ${selectedSession.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />)}
                  </div>
                  <p className="text-lg italic font-medium text-zinc-700 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border">
                    "{selectedSession.review || "لا توجد ملاحظات مكتوبة."}"
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground font-bold italic">لم يتم تقييم الجلسة من قبل الطالب بعد.</p>
              )}
            </div>
          </div>

          <div className="p-8 bg-zinc-50 border-t flex justify-end">
            <Button onClick={() => setSelectedSession(null)} className="rounded-2xl px-10 h-14 font-black text-lg">إغلاق التقرير</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-10 bg-zinc-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl">
        <div className="bg-blue-500/20 p-8 rounded-[2rem] shrink-0">
          <ShieldAlert size={60} className="text-blue-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black">نظام الرقابة وحماية الخصوصية</h3>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-4xl text-lg">
            يتم توثيق كافة المحاضرات صوت وصورة لضمان حقوق الطلاب والمعلمين. في حال وجود أي نزاع، يمكن للإدارة مراجعة التسجيلات واتخاذ القرارات العادلة بناءً على ما حدث في الجلسة.
          </p>
        </div>
      </div>
    </div>
  );
}
