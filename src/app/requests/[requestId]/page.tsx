
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
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RequestDetailsPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId as string);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

  // جلب بيانات صاحب المشروع للقسم الجانبي
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
        {/* Breadcrumb / Back */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 hover:bg-white gap-2 font-bold text-zinc-600"
        >
          <ChevronRight size={18} />
          العودة للقائمة
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-8 space-y-8">
                <div className="border-b pb-6">
                  <h1 className="text-3xl font-black text-zinc-900 leading-tight">تفاصيل المشروع</h1>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary">{request.title}</h2>
                  
                  <div className="prose prose-zinc max-w-none">
                    <p className="text-zinc-700 text-lg leading-relaxed whitespace-pre-wrap">
                      {request.description}
                    </p>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-4 pt-6 border-t border-dashed">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Tag size={18} className="text-primary" /> المهارات المطلوبة:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-lg font-bold">
                      {request.category}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-lg font-bold">
                      {request.categorySub || "تحليل أعمال"}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-lg font-bold">
                      {request.categoryOption || "إدارة مشاريع"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons based on status */}
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

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Project Stats Card */}
            <Card className="rounded-2xl border-none shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">حالة المشروع</span>
                    <Badge className={`${
                      request.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-600'
                    } border-none px-3 font-black`}>
                      {request.status === 'active' ? 'مفتوح' : 'قيد التنفيذ'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">تاريخ النشر</span>
                    <span className="text-zinc-900 font-bold flex items-center gap-1.5">
                      <Clock size={14} /> منذ قليل
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">الميزانية</span>
                    <span className="text-primary font-black text-lg">
                      {request.amount} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold">مدة التنفيذ</span>
                    <span className="text-zinc-900 font-bold flex items-center gap-1.5">
                      <Timer size={14} /> يومين
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info Card */}
            <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b bg-zinc-50/50">
                <h4 className="font-black text-zinc-800">صاحب المشروع</h4>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/10">
                    <AvatarImage src={owner?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xl">
                      {request.mustafhemName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="font-black text-zinc-900 flex items-center gap-1">
                      {request.mustafhemName}
                      <ShieldCheck size={14} className="text-blue-500" />
                    </p>
                    <p className="text-xs text-zinc-500 font-bold">مستفهم طموح</p>
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
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">المشاريع المفتوحة</span>
                    <span className="text-zinc-900 font-bold">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
