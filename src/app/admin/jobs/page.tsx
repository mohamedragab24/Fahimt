
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Briefcase, 
  Clock, 
  Loader2, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminJobs() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPosting, setIsPosting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", requirements: "", type: "full-time" });

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "jobs"));
  }, [firestore]);

  const { data: rawJobs, isLoading } = useCollection(jobsQuery);
  const jobs = rawJobs?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePost = async () => {
    if (!firestore || !newJob.title || !newJob.description) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }
    setIsPosting(true);
    try {
      await addDoc(collection(firestore, "jobs"), {
        ...newJob,
        status: "active",
        createdAt: new Date().toISOString()
      });
      toast({ title: "تم نشر الوظيفة", description: "الوظيفة متاحة الآن للجميع في صفحة الوظائف." });
      setNewJob({ title: "", description: "", requirements: "", type: "full-time" });
      setIsModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في النشر" });
    } finally {
      setIsPosting(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "jobs", id), { status: current === 'active' ? 'closed' : 'active' });
      toast({ title: "تم التحديث" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "jobs", id));
      toast({ title: "تم الحذف نهائياً" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الحذف" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl font-black font-headline">إدارة الوظائف</h1>
          <p className="text-muted-foreground text-lg">نشر فرص عمل جديدة وإدارة الطلبات الحالية.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
          <Plus className="ml-2 h-6 w-6" /> نشر وظيفة جديدة
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-black text-2xl">جاري تحميل سجل الوظائف...</div>
        ) : jobs?.map((job) => (
          <Card key={job.id} className={`rounded-[2.5rem] border-2 transition-all shadow-md overflow-hidden bg-white ${job.status === 'closed' ? 'opacity-60 grayscale' : ''}`}>
            <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-3 text-right flex-1">
                <div className="flex items-center gap-3 justify-end md:justify-start">
                  <Badge className={`font-bold ${job.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {job.status === 'active' ? 'نشطة' : 'مغلقة'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-bold">{new Date(job.createdAt).toLocaleString('ar-EG')}</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-900">{job.title}</h3>
                <p className="text-zinc-600 font-bold text-sm">{job.type === 'full-time' ? 'دوام كامل' : 'عمل حر'}</p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => toggleStatus(job.id, job.status)} className="h-12 rounded-xl font-bold border-2">
                  {job.status === 'active' ? <><ToggleRight className="ml-2 text-green-600" /> إغلاق</> : <><ToggleLeft className="ml-2 text-muted-foreground" /> تفعيل</>}
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(job.id)} className="h-12 rounded-xl font-bold">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && jobs?.length === 0 && (
          <div className="py-20 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد وظائف منشورة حالياً.</div>
        )}
      </div>

      {/* مودال نشر وظيفة */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[3rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
              <Briefcase className="text-primary h-8 w-8" /> نشر فرصة وظيفية
            </DialogTitle>
            <DialogDescription className="text-right">أدخل بيانات الوظيفة المطلوبة لتظهر في صفحة الوظائف العامة.</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto px-2">
            <div className="space-y-2">
              <Label className="font-bold">مسمى الوظيفة</Label>
              <Input placeholder="مثال: مطور تطبيقات فلاتر" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="h-14 rounded-xl border-2" />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold">نوع الدوام</Label>
              <Select value={newJob.type} onValueChange={(v) => setNewJob({...newJob, type: v})}>
                <SelectTrigger className="h-14 rounded-xl border-2">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">دوام كامل (Full-time)</SelectItem>
                  <SelectItem value="part-time">دوام جزئي (Part-time)</SelectItem>
                  <SelectItem value="project">عمل بالمشروع (Freelance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">وصف الوظيفة</Label>
              <Textarea placeholder="اشرح طبيعة العمل والمهام..." value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="h-32 rounded-xl border-2 p-4" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">المتطلبات والشروط</Label>
              <Textarea placeholder="أهم المهارات والخبرات المطلوبة..." value={newJob.requirements} onChange={(e) => setNewJob({...newJob, requirements: e.target.value})} className="h-32 rounded-xl border-2 p-4" />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handlePost} disabled={isPosting} className="w-full h-16 rounded-2xl font-black text-xl shadow-lg">
              {isPosting ? <><Loader2 className="animate-spin ml-2" /> جاري النشر...</> : "نشر الوظيفة الآن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
