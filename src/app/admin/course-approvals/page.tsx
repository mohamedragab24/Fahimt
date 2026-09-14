"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  GraduationCap,
  Film,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/lib/types";
import {
  subscribeToCourses,
  approveCourse,
  rejectCourse,
  setCoursePaused,
  deleteCourse,
} from "@/lib/courses-data";

export default function AdminCourseApprovals() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectTarget, setRejectTarget] = useState<Course | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  useEffect(() => {
    const unsub = subscribeToCourses((data) => {
      setCourses(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const pending = courses.filter((c) => c.status === "pending");
  const approved = courses.filter((c) => c.status === "approved");
  const rejected = courses.filter((c) => c.status === "rejected");

  const handleApprove = async (course: Course) => {
    try {
      await approveCourse(course.id);
      toast({ title: "تم اعتماد الكورس", description: `أصبح كورس "${course.title}" ظاهراً للطلاب الآن.` });
    } catch {
      toast({ variant: "destructive", title: "تعذر الاعتماد", description: "حدث خطأ، حاول مرة أخرى." });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast({ variant: "destructive", title: "اكتب سبب الرفض", description: "لازم تكتب سبب واضح يوصل للمُفهم." });
      return;
    }
    try {
      await rejectCourse(rejectTarget.id, rejectReason.trim());
      toast({ title: "تم رفض الكورس", description: "تم إرسال سبب الرفض للمُفهم." });
      setRejectTarget(null);
      setRejectReason("");
    } catch {
      toast({ variant: "destructive", title: "تعذر الرفض", description: "حدث خطأ، حاول مرة أخرى." });
    }
  };

  const handleTogglePause = async (course: Course) => {
    try {
      await setCoursePaused(course.id, !course.isPaused);
      toast({
        title: course.isPaused ? "تم تفعيل الكورس" : "تم إيقاف الكورس مؤقتاً",
        description: course.isPaused ? "أصبح الكورس ظاهراً للطلاب تاني." : "اختفى الكورس من صفحة الطلاب مؤقتاً.",
      });
    } catch {
      toast({ variant: "destructive", title: "تعذر تنفيذ الإجراء", description: "حدث خطأ، حاول مرة أخرى." });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      toast({ title: "تم حذف الكورس نهائياً" });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "تعذر الحذف", description: "حدث خطأ، حاول مرة أخرى." });
    }
  };

  const CourseRow = ({ course }: { course: Course }) => (
    <div className="p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-right">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img src={course.coverUrl} alt={course.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border" />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={course.instructorAvatar} />
              <AvatarFallback className="text-[9px]">{course.instructorName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold text-zinc-500 truncate">{course.instructorName}</span>
          </div>
          <h4 className="font-black text-zinc-900 dark:text-white truncate">{course.title}</h4>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-bold">
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{course.price} ج.م</span>
            <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5" />{course.lessons?.length || 0} دروس</span>
            {course.externalPlayerUrl ? (
              <span className="flex items-center gap-1 text-emerald-600"><ExternalLink className="w-3.5 h-3.5" />رابط مشغل خارجي متوفر</span>
            ) : (
              (course.lessons?.length || 0) > 1 && (
                <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3.5 h-3.5" />بدون رابط مشغل خارجي</span>
              )
            )}
          </div>
          {course.status === "rejected" && course.rejectionReason && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 max-w-md">
              سبب الرفض: {course.rejectionReason}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end shrink-0">
        {course.status === "pending" && (
          <>
            <Button
              onClick={() => handleApprove(course)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-lg gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> موافقة
            </Button>
            <Button
              variant="outline"
              onClick={() => { setRejectTarget(course); setRejectReason(""); }}
              className="text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs h-9 rounded-lg gap-1.5"
            >
              <XCircle className="w-4 h-4" /> رفض
            </Button>
          </>
        )}

        {course.status === "approved" && (
          <Button
            variant="outline"
            onClick={() => handleTogglePause(course)}
            className="font-bold text-xs h-9 rounded-lg gap-1.5"
          >
            {course.isPaused ? <><Play className="w-4 h-4" /> تفعيل</> : <><Pause className="w-4 h-4" /> إيقاف مؤقت</>}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => setDeleteTarget(course)}
          className="text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs h-9 rounded-lg gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> حذف
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" /> اعتماد الكورسات
        </h1>
        <p className="text-sm text-zinc-500 font-bold mt-1">
          الكورس لا يظهر للطلاب إلا بعد موافقة الإدارة هنا. الكورسات المعتمدة يمكن إيقافها مؤقتاً أو حذفها في أي وقت.
        </p>
      </div>

      <Tabs defaultValue="pending" dir="rtl">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-4 h-4" /> قيد المراجعة ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> معتمدة ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">
            <XCircle className="w-4 h-4" /> مرفوضة ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 pt-4">
          {loading ? (
            <p className="text-center text-zinc-400 font-bold py-8">جارٍ التحميل...</p>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-bold border-2 border-dashed rounded-2xl">
              لا توجد كورسات قيد المراجعة حالياً.
            </div>
          ) : (
            pending.map((c) => <CourseRow key={c.id} course={c} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 pt-4">
          {approved.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-bold border-2 border-dashed rounded-2xl">
              لا توجد كورسات معتمدة بعد.
            </div>
          ) : (
            approved.map((c) => <CourseRow key={c.id} course={c} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-3 pt-4">
          {rejected.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-bold border-2 border-dashed rounded-2xl">
              لا توجد كورسات مرفوضة.
            </div>
          ) : (
            rejected.map((c) => <CourseRow key={c.id} course={c} />)
          )}
        </TabsContent>
      </Tabs>

      {/* حوار الرفض مع كتابة السبب */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader className="text-right">
            <DialogTitle>رفض الكورس</DialogTitle>
            <DialogDescription>
              اكتب سبب رفض كورس "{rejectTarget?.title}" — السبب هيوصل للمُفهم مباشرة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>سبب الرفض</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثال: صورة الغلاف غير واضحة، أو المحتوى لا يطابق شروط المنصة..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد الحذف */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader className="text-right">
            <DialogTitle>حذف الكورس نهائياً</DialogTitle>
            <DialogDescription>
              هيتم حذف كورس "{deleteTarget?.title}" نهائياً ولن يظهر للمُفهم أو للطلاب. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>نعم، احذف نهائياً</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
