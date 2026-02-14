
"use client";

import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { 
  Clock, 
  User, 
  BadgeCent, 
  Calendar, 
  CheckCircle2, 
  Tag, 
  Briefcase,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Timer,
  ImageIcon,
  Mail,
  Phone,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function RequestDetailsPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId as string);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

  // جلب بيانات صاحب المشروع
  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !request?.mustafhemId) return null;
    return doc(firestore, "users", request.mustafhemId);
  }, [firestore, request?.mustafhemId]);

  const { data: owner } = useDoc(ownerRef);

  if (isLoading) return <div className="p-20 text-center animate-pulse font-bold">جاري تحميل تفاصيل المشروع...</div>;
  if (!request) return <div className="p-20 text-center font-bold text-red-500">عذراً، هذا المشروع غير موجود.</div>;

  return (
    <div className="bg-zinc-50 min-h-screen pb-20" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 hover:bg-white gap-2 font-bold text-zinc-600"
        >
          <ChevronRight size={18} />
          العودة للقائمة
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-8 space-y-8">
                <div className="border-b pb-6">
                  <h1 className="text-3xl font-black text-zinc-900 leading-tight">تفاصيل المشروع</h1>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary">{request.title}</h2>
                  
                  <div className="prose prose-zinc max-w-none">
                    <p className="text-zinc-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {request.description}
                    </p>
                  </div>

                  {request.attachmentUrl && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                        <ImageIcon size={18} className="text-primary" /> المرفقات التوضيحية:
                      </h4>
                      <div className="rounded-2xl overflow-hidden border-2 shadow-sm max-w-md">
                        <img src={request.attachmentUrl} alt="Attachment" className="w-full h-auto" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Tag size={18} className="text-primary" /> المهارات المطلوبة:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-lg font-bold">
                      {request.category}
                    </Badge>
                    {request.categorySub && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-lg font-bold">
                        {request.categorySub}
                      </Badge>
                    )}
                    {request.categoryOption && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-lg font-bold">
                        {request.categoryOption}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              {request.status === 'accepted' && (request.mustafhemId === currentUser?.uid || request.mufhemId === currentUser?.uid) && (
                <Button 
                  onClick={() => router.push(`/meeting/${request.id}`)}
                  className="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-black shadow-xl"
                >
                  دخول المحاضرة الآن
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-none shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">حالة المشروع</span>
                    <Badge className={`${
                      request.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-600'
                    } border-none px-3 font-black`}>
                      {request.status === 'active' ? 'مفتوح' : 
                       request.status === 'accepted' ? 'قيد التنفيذ' : 
                       request.status === 'completed' ? 'مكتمل' : 'بانتظار المراجعة'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">تاريخ النشر</span>
                    <span className="text-zinc-900 font-bold flex items-center gap-1.5">
                      <Clock size={14} /> {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">الميزانية</span>
                    <span className="text-primary font-black text-lg">
                      {request.amount} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b bg-zinc-50/50">
                <h4 className="font-black text-zinc-800">صاحب المشروع</h4>
              </div>
              <CardContent className="p-6 space-y-6">
                <div 
                  className="flex items-center gap-4 cursor-pointer group"
                  onClick={() => setShowOwnerProfile(true)}
                >
                  <Avatar className="h-14 w-14 border-2 border-primary/10 group-hover:border-primary transition-all">
                    <AvatarImage src={owner?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                      {request.mustafhemName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="font-black text-zinc-900 flex items-center gap-1 group-hover:text-primary transition-colors">
                      {request.mustafhemName}
                      <ShieldCheck size={14} className="text-blue-500" />
                    </p>
                    <p className="text-xs text-zinc-500 font-bold">اضغط لعرض الملف</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">تاريخ التسجيل</span>
                    <span className="text-zinc-900 font-bold">{owner?.createdAt ? new Date(owner.createdAt).toLocaleDateString('ar-EG') : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">معدل التوظيف</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-black">100%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showOwnerProfile} onOpenChange={setShowOwnerProfile}>
        <DialogContent className="rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-black flex items-center gap-3">
              <UserCircle className="text-primary" /> ملف صاحب المشروع
            </DialogTitle>
            <DialogDescription className="text-right">معلومات أساسية حول المستفهم.</DialogDescription>
          </DialogHeader>
          {owner && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center gap-4 p-6 bg-muted/20 rounded-3xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={owner.profilePictureUrl} />
                  <AvatarFallback className="text-3xl font-black">{owner.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h4 className="text-2xl font-black">{owner.fullName}</h4>
                  <Badge className="mt-2">{owner.role === 'mufhem' ? 'مفهم' : 'مستفهم'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border text-right">
                  <span className="text-xs font-bold text-muted-foreground block">تاريخ الانضمام</span>
                  <span className="font-black">{new Date(owner.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border text-right">
                  <span className="text-xs font-bold text-muted-foreground block">الجنس</span>
                  <span className="font-black">{owner.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
