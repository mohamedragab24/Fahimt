
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, addDoc, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  UserCheck, 
  Clock,
  IdCard,
  Eye,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminVerification() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(userRef);

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const canReadVerifications = adminProfile?.isAdmin || isMasterAdmin;

  // جلب الطلبات المعلقة (المستخدمين الذين رفعوا بطاقاتهم ولم يوثقوا بعد)
  const pendingVerQuery = useMemoFirebase(() => {
    if (!firestore || !canReadVerifications) return null;
    return query(
      collection(firestore, "users"), 
      where("verificationStatus", "==", "pending"),
      limit(100)
    );
  }, [firestore, canReadVerifications]);

  const { data: pendingUsers, isLoading } = useCollection(pendingVerQuery);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    if (!firestore) return;
    try {
      const isApproved = action === 'approve';
      
      // تحديث حالة المستخدم في Firestore
      await updateDoc(doc(firestore, "users", userId), {
        isVerified: isApproved,
        verificationStatus: isApproved ? 'verified' : 'rejected',
        idCardFront: isApproved ? selectedUser.idCardFront : null, // نحتفظ بالصور إذا تم التوثيق
        idCardBack: isApproved ? selectedUser.idCardBack : null,
        verifiedAt: isApproved ? new Date().toISOString() : null
      });
      
      // إرسال إشعار للمستخدم
      await addDoc(collection(firestore, "notifications"), {
        userId: userId,
        title: isApproved ? "تم توثيق هويتك بنجاح!" : "فشل توثيق الهوية",
        message: isApproved 
          ? "تهانينا، تم التحقق من وثائقك الثبوتية. حصلت الآن على شارة التوثيق الزرقاء وكافة مميزات الخبراء."
          : "عذراً، لم نتمكن من قبول وثائق الهوية المرفوعة. يرجى التأكد من وضوح الصور ومطابقتها لبياناتك.",
        type: isApproved ? "verification_success" : "verification_failed",
        read: false,
        createdAt: new Date().toISOString()
      });

      // سجل العمليات الإدارية
      await addDoc(collection(firestore, "adminLogs"), {
        action: isApproved ? 'verify_user' : 'reject_verification',
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });

      toast({ 
        title: isApproved ? "تم التوثيق بنجاح!" : "تم الرفض", 
        description: `تم تحديث حالة الحساب ومنحه الشارة الزرقاء.` 
      });
      
      setSelectedUser(null);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تنفيذ عملية التوثيق." });
    }
  };

  if (!canReadVerifications && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لمركز التوثيق.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-accent pr-6">
        <div className="space-y-2 text-right">
          <h1 className="text-4xl md:text-5xl font-black font-headline text-zinc-900">مركز توثيق الهوية</h1>
          <p className="text-muted-foreground text-lg">مراجعة البطاقات الشخصية ومنح شارة التوثيق الزرقاء للخبراء والمستخدمين الموثوقين.</p>
        </div>
        <div className="bg-accent/10 px-6 py-3 rounded-2xl flex items-center gap-3 border border-accent/10 text-accent font-black">
          <ShieldCheck /> نظام أمان فهمت المطور
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-black flex items-center gap-3 justify-end">
          طلبات معلقة ({pendingUsers?.length || 0}) <Clock className="text-orange-500 animate-pulse" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full py-32 text-center animate-pulse font-black text-2xl opacity-20">جاري فحص طلبات التوثيق...</div>
          ) : pendingUsers?.map((u) => (
            <Card key={u.id} className="shadow-xl rounded-[3rem] overflow-hidden border-2 hover:border-accent/20 transition-all bg-white group">
              <CardHeader className="bg-muted/30 p-8 flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                    <AvatarImage src={u.profilePictureUrl} />
                    <AvatarFallback className="text-3xl font-black bg-zinc-100">{u.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md">
                    <IdCard className="text-accent" size={20} />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-black">{u.fullName}</CardTitle>
                  <p className="text-xs text-muted-foreground font-bold mt-1">{u.email}</p>
                  <Badge variant="outline" className="mt-3 bg-white font-bold">{u.role === 'mufhem' ? 'خبير' : 'طالب'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button 
                  onClick={() => setSelectedUser(u)}
                  className="w-full h-14 rounded-2xl font-black text-lg bg-zinc-900 hover:bg-accent transition-all shadow-lg"
                >
                  <Eye className="ml-2 h-5 w-5" /> مراجعة الوثائق
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleAction(u.id, 'approve')} className="bg-green-600 hover:bg-green-700 h-12 rounded-xl font-black text-white">توثيق مباشر</Button>
                  <Button onClick={() => handleAction(u.id, 'reject')} variant="destructive" className="h-12 rounded-xl font-black">رفض</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!pendingUsers || pendingUsers.length === 0) && !isLoading && (
            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-zinc-100 shadow-inner flex flex-col items-center gap-6">
              <div className="bg-zinc-50 p-8 rounded-full"><FileCheck size={64} className="text-zinc-200" /></div>
              <p className="text-2xl font-black text-zinc-300 italic">لا توجد طلبات توثيق هوية معلقة حالياً.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <DialogHeader className="p-8 border-b bg-zinc-900 text-white flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
                <ShieldCheck className="text-primary h-10 w-10" /> مراجعة وثائق الهوية
              </DialogTitle>
              <DialogDescription className="text-right text-zinc-400 font-bold">
                المستخدم: {selectedUser?.fullName} | {selectedUser?.id}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh]">
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="font-black text-lg border-r-4 border-primary pr-3 block">الوجه الأمامي (Front)</Label>
                  <div className="aspect-[1.6/1] bg-zinc-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative group">
                    {selectedUser?.idCardFront ? (
                      <img src={selectedUser.idCardFront} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="ID Front" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
                        <AlertCircle size={48} />
                        <p className="font-bold">لم ترفع الصورة الأمامية</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-black text-lg border-r-4 border-primary pr-3 block">الوجه الخلفي (Back)</Label>
                  <div className="aspect-[1.6/1] bg-zinc-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative group">
                    {selectedUser?.idCardBack ? (
                      <img src={selectedUser.idCardBack} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="ID Back" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
                        <AlertCircle size={48} />
                        <p className="font-bold">لم ترفع الصورة الخلفية</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-dashed border-blue-200 flex items-start gap-6 text-blue-800">
                <ShieldCheck size={40} className="shrink-0 text-blue-600" />
                <div className="space-y-2">
                  <h4 className="font-black text-xl">تأكد من المعايير التالية قبل التوثيق:</h4>
                  <ul className="list-disc list-inside space-y-1 font-bold text-sm">
                    <li>مطابقة الاسم في البطاقة للاسم المسجل في المنصة.</li>
                    <li>وضوح الأرقام القومية وتاريخ الانتهاء.</li>
                    <li>أن تكون الصور ملونة وليست تصويراً ضوئياً (Scanner) أبيض وأسود.</li>
                    <li>وضوح صورة الشخص في البطاقة ومقارنتها بصورته الشخصية في الحساب.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 pb-6">
                <Button 
                  onClick={() => handleAction(selectedUser.id, 'approve')} 
                  className="h-20 rounded-[2rem] bg-green-600 hover:bg-green-700 font-black text-2xl text-white shadow-2xl transition-all active:scale-95"
                >
                  <CheckCircle2 size={32} className="ml-3" /> اعتماد التوثيق الآن
                </Button>
                <Button 
                  onClick={() => handleAction(selectedUser.id, 'reject')} 
                  variant="destructive" 
                  className="h-20 rounded-[2rem] font-black text-2xl shadow-2xl transition-all active:scale-95"
                >
                  <XCircle size={32} className="ml-3" /> رفض الطلب وحذف الصور
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
