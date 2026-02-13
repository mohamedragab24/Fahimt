
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, ShieldCheck, User, Calendar, Clock, Star, ShieldAlert, Link as LinkIcon, BadgeCent, X, PlayCircle, FileText, CheckCircle2 } from "lucide-react";
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

  if (!canReadSessions && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لمركز الرقابة.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-blue-600 pr-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">سجلات الرقابة الإدارية</h1>
          <p className="text-muted-foreground text-lg">مراجعة تقارير المحاضرات، التقييمات، والتسجيلات صوت وصورة لحل النزاعات.</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-3 text-blue-700">
          <ShieldCheck />
          <span className="font-black">مركز حماية الحقوق مفعل</span>
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black text-zinc-900">المحاضرة</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الأطراف</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الحالة والمبلغ</TableHead>
              <TableHead className="text-right font-black text-zinc-900">التقييم</TableHead>
              <TableHead className="text-left px-8 font-black text-zinc-900">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold animate-pulse">جاري جلب السجلات من الأرشيف...</TableCell></TableRow>
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
                    <span className="font-bold text-accent flex items-center gap-1"><ShieldCheck size={14}/> {session.mufhemName || 'لم يتم الربط'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs font-bold space-y-1">
                    <Badge className={session.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}>
                      {session.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
                    </Badge>
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
                    <PlayCircle size={16} /> مراجعة التقرير
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!sessions || sessions.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-black opacity-30 text-xl">لا توجد محاضرات في الأرشيف حتى الآن.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="p-0">
            <DialogTitle className="sr-only">مراجعة المحاضرة</DialogTitle>
            <DialogDescription className="sr-only">تقرير كامل صوت وصورة للمحاضرة المختارة.</DialogDescription>
          </DialogHeader>
          
          <div className="bg-zinc-900 p-8 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black">{selectedSession?.title}</h2>
              <p className="text-zinc-400 font-bold mt-1">تقرير الرقابة الكامل للمحاضرة</p>
            </div>
            <div className="bg-primary/20 p-4 rounded-2xl">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReportBox icon={User} label="المستفهم (الطالب)" value={selectedSession?.mustafhemName} />
              <ReportBox icon={ShieldCheck} label="المفهم (الخبير)" value={selectedSession?.mufhemName} />
              <ReportBox icon={BadgeCent} label="المبلغ المتداول" value={`${selectedSession?.amount} ج.م`} />
              <ReportBox icon={Clock} label="تاريخ الانعقاد" value={selectedSession?.createdAt ? new Date(selectedSession.createdAt).toLocaleString('ar-EG') : '-'} />
            </div>

            <div className="p-8 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-4">
              <h4 className="text-xl font-black flex items-center gap-3"><Star className="text-yellow-500 fill-yellow-500" /> تقييم الطالب والملاحظات</h4>
              {selectedSession?.rating ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`h-6 w-6 ${selectedSession.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />)}
                  </div>
                  <p className="text-lg italic font-medium text-zinc-700 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border">
                    "{selectedSession.review || "لا توجد ملاحظات نصية مضافة."}"
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground font-bold italic">لم يتم تقييم هذه الجلسة بعد من قبل الطالب.</p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-black flex items-center gap-3 text-blue-600"><Video /> تسجيل المحاضرة (فيديو مدمج)</h4>
              {selectedSession?.recordingUrl ? (
                <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl">
                  {selectedSession.recordingUrl.includes('Fahimni_Room') ? (
                    <iframe 
                      src={selectedSession.recordingUrl} 
                      className="w-full h-full border-none"
                      allow="autoplay; fullscreen"
                    />
                  ) : (
                    <video controls className="w-full h-full">
                      <source src={selectedSession.recordingUrl} type="video/mp4" />
                      متصفحك لا يدعم تشغيل الفيديو.
                    </video>
                  )}
                </div>
              ) : (
                <div className="p-10 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200 flex flex-col items-center gap-4 text-center">
                  <ShieldAlert className="h-16 w-16 text-orange-400" />
                  <div>
                    <p className="text-orange-900 font-black text-xl">الفيديو قيد المعالجة والرفع</p>
                    <p className="text-orange-700 font-bold max-w-md mt-2">الجلسة انتهت، ويقوم النظام حالياً بضغط ورفع التسجيل صوت وصورة للأرشيف.</p>
                  </div>
                </div>
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
          <h3 className="text-3xl font-black">لماذا نوثق المحاضرات بالفيديو؟</h3>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-4xl text-lg">
            نظام الرقابة الإدارية في "فهمني" يهدف لحماية حقوق الجميع. يتم تسجيل المحاضرات صوت وصورة للرجوع إليها في حال وجود أي شكوى تقنية أو مالية، مما يضمن بيئة تعليمية آمنة وعادلة.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportBox({ icon: Icon, label, value }: any) {
  return (
    <div className="p-6 bg-zinc-50 rounded-2xl border flex items-center gap-5 hover:bg-white transition-colors hover:shadow-md">
      <div className="bg-white p-3 rounded-xl shadow-sm text-primary">
        <Icon size={24} />
      </div>
      <div>
        <span className="text-[10px] font-black text-muted-foreground block uppercase tracking-widest">{label}</span>
        <span className="font-black text-lg text-zinc-900">{value || "غير محدد"}</span>
      </div>
    </div>
  );
}
