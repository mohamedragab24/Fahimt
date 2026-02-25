
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  UserCircle,
  HelpCircle,
  BadgeCent,
  MapPin,
  FileText,
  MessageSquare,
  ImageIcon,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function AdminApprovals() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedIstifham, setSelectedIstifham] = useState<any>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(userRef);

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const canReadApprovals = adminProfile?.isAdmin || isMasterAdmin;

  // جلب الحسابات التي تحتاج لمراجعة الصورة الشخصية
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !canReadApprovals) return null;
    return query(collection(firestore, "users"), where("isProfileApproved", "==", false), limit(500));
  }, [firestore, canReadApprovals]);

  // جلب الاستفهامات التي تحتاج لمراجعة المحتوى
  const istifhamsQuery = useMemoFirebase(() => {
    if (!firestore || !canReadApprovals) return null;
    return query(collection(firestore, "istifhams"), where("status", "==", "pending_approval"));
  }, [firestore, canReadApprovals]);

  const { data: profiles, isLoading: profilesLoading } = useCollection(profilesQuery);
  const { data: istifhams, isLoading: istifhamsLoading } = useCollection(istifhamsQuery);

  const handleApproveProfile = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    updateDocumentNonBlocking(uRef, { isProfileApproved: true, status: 'active' });
    
    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: u.id,
      title: "تم اعتماد صورتك الشخصية!",
      message: "تهانينا، تم مراجعة صورتك الشخصية واعتماد حسابك بنجاح. ملفك الآن يظهر بشكل رسمي للجميع.",
      type: "approval",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ title: "تم الاعتماد", description: "تم تفعيل الصورة الشخصية وإرسال إشعار للمستخدم." });
    setSelectedUser(null);
  };

  const handleRejectProfile = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    updateDocumentNonBlocking(uRef, { isProfileApproved: false, profilePictureUrl: null });
    
    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: u.id,
      title: "تم رفض الصورة الشخصية",
      message: "عذراً، الصورة الشخصية التي قمت برفعها لا تستوفي شروط المنصة. يرجى رفع صورة واضحة واحترافية.",
      type: "rejection",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ variant: "destructive", title: "تم الرفض", description: "تم حذف الصورة وإخطار المستخدم بضرورة رفع صورة بديلة." });
    setSelectedUser(null);
  };

  const handleApproveIstifham = (ist: any) => {
    if (!firestore) return;
    const istRef = doc(firestore, "istifhams", ist.id);
    updateDocumentNonBlocking(istRef, { 
      status: "active",
      approvedAt: new Date().toISOString()
    });
    toast({ title: "تم النشر بنجاح", description: "الاستفهام متاح الآن لكافة المُفهمين." });
    setSelectedIstifham(null);
  };

  const handleRejectIstifham = (id: string) => {
    if (!firestore) return;
    const istRef = doc(firestore, "istifhams", id);
    updateDocumentNonBlocking(istRef, { status: "canceled" });
    toast({ variant: "destructive", title: "تم رفض الاستفهام", description: "تم إلغاء الطلب ولن يظهر للعامة." });
    setSelectedIstifham(null);
  };

  if (!canReadApprovals && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لهذه الصفحة.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6 text-right">
        <h1 className="text-4xl font-black font-headline text-zinc-900">مركز الاعتماد والرقابة</h1>
        <p className="text-muted-foreground text-lg">مراجعة الصور الشخصية والطلبات الجديدة لضمان بيئة تعليمية احترافية.</p>
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 p-1 bg-muted rounded-2xl mb-8">
          <TabsTrigger value="profiles" className="rounded-xl text-lg font-bold">
            <ImageIcon className="ml-2 h-5 w-5" /> مراجعة الصور ({profiles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="istifhams" className="rounded-xl text-lg font-bold">
            <MessageSquare className="ml-2 h-5 w-5" /> مراجعة الاستفهامات ({istifhams?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {profilesLoading ? <p className="col-span-full text-center font-bold animate-pulse">جاري تحميل الحسابات...</p> : 
              profiles?.map((p) => (
                <Card key={p.id} className="rounded-[2.5rem] overflow-hidden shadow-lg border-2 hover:border-primary/20 transition-all bg-white group">
                  <CardHeader className="bg-muted/30 p-8 flex flex-col items-center text-center">
                    <div className="relative mb-4 group-hover:scale-105 transition-transform">
                      <Avatar className="h-32 w-32 border-8 border-white shadow-2xl">
                        <AvatarImage src={p.profilePictureUrl} />
                        <AvatarFallback className="text-4xl font-black">{p.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg animate-pulse">
                        <Clock size={16} />
                      </div>
                    </div>
                    <CardTitle className="font-black text-xl">{p.fullName}</CardTitle>
                    <Badge variant="outline" className="mt-2 text-primary font-bold border-primary/20">
                      {p.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Button variant="outline" onClick={() => setSelectedUser(p)} className="w-full h-12 rounded-xl font-bold border-2"><Eye className="ml-2 h-5 w-5" /> معاينة كاملة</Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleApproveProfile(p)} className="bg-green-600 hover:bg-green-700 font-black rounded-xl h-12 text-white">اعتماد الصورة</Button>
                      <Button onClick={() => handleRejectProfile(p)} variant="destructive" className="font-black rounded-xl h-12">رفض الصورة</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
            {!profilesLoading && profiles?.length === 0 && <div className="col-span-full py-32 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد صور شخصية معلقة للمراجعة.</div>}
          </div>
        </TabsContent>

        <TabsContent value="istifhams">
          <div className="grid gap-6">
            {istifhamsLoading ? <p className="text-center font-bold animate-pulse">جاري تحميل الاستفهامات...</p> :
              istifhams?.map((ist) => (
                <Card key={ist.id} className="rounded-3xl border-2 p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 bg-white group hover:border-primary/20 transition-all">
                  <div className="space-y-2 text-right w-full">
                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock size={12}/> {new Date(ist.createdAt).toLocaleString('ar-EG')}</span>
                      <Badge className="bg-primary/10 text-primary border-none font-bold">{ist.category}</Badge>
                    </div>
                    <h4 className="text-2xl font-black text-zinc-800 group-hover:text-primary transition-colors text-right">{ist.title}</h4>
                    <p className="font-bold text-muted-foreground text-right">بواسطة: <span className="text-zinc-900">{ist.mustafhemName}</span> | الميزانية: <span className="text-green-600">{ist.amount} ج.م</span></p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto shrink-0">
                    <Button variant="outline" onClick={() => setSelectedIstifham(ist)} className="h-14 px-8 font-black rounded-2xl border-2"><Eye className="ml-2 h-5 w-5" /> التفاصيل</Button>
                    <Button onClick={() => handleApproveIstifham(ist)} className="bg-green-600 hover:bg-green-700 h-14 px-8 font-black rounded-2xl shadow-lg text-white">نشر الطلب</Button>
                  </div>
                </Card>
              ))
            }
            {!istifhamsLoading && istifhams?.length === 0 && <div className="col-span-full py-32 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد استفهامات جديدة للمراجعة.</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* مودال تفاصيل الحساب */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3"><UserCircle className="text-primary h-8 w-8" /> مراجعة الصورة والبيانات</DialogTitle>
            <DialogDescription className="text-right">التأكد من مطابقة الصورة الشخصية لمعايير منصة فهمت.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-6 space-y-8">
              <div className="flex flex-col items-center gap-6 p-8 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
                <Avatar className="h-48 w-48 border-8 border-white shadow-2xl">
                  <AvatarImage src={selectedUser.profilePictureUrl} />
                  <AvatarFallback className="text-5xl font-black">{selectedUser.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center space-y-2">
                  <h4 className="text-2xl font-black">{selectedUser.fullName}</h4>
                  <div className="flex gap-2 justify-center">
                    <Badge className="bg-muted text-muted-foreground font-bold">{selectedUser.gender === 'male' ? 'ذكر' : 'أنثى'}</Badge>
                    <Badge className="bg-primary/10 text-primary font-bold">{selectedUser.role === 'mufhem' ? 'خبير' : 'طالب'}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-zinc-50 rounded-2xl space-y-4">
                <h5 className="font-black text-sm text-zinc-400 uppercase">النبذة التعريفية</h5>
                <p className="text-zinc-700 font-medium italic">"{selectedUser.bio || 'لا توجد نبذة مكتوبة.'}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleApproveProfile(selectedUser)} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xl text-white shadow-xl">اعتماد الصورة الآن</Button>
                <Button onClick={() => handleRejectProfile(selectedUser)} variant="destructive" className="h-16 rounded-2xl font-black text-xl shadow-xl">رفض وحذف الصورة</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مودال تفاصيل الاستفهام */}
      <Dialog open={!!selectedIstifham} onOpenChange={() => setSelectedIstifham(null)}>
        <DialogContent className="sm:max-w-[650px] rounded-[3rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3"><HelpCircle className="text-primary h-8 w-8" /> مراجعة طلب الاستفهام</DialogTitle>
            <DialogDescription className="text-right">مراجعة المحتوى، الأهداف، والميزانية قبل النشر للعامة.</DialogDescription>
          </DialogHeader>
          {selectedIstifham && (
            <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-dashed space-y-6 text-right">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary">عنوان الطلب</Label>
                  <h4 className="text-2xl font-black text-zinc-900">{selectedIstifham.title}</h4>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary">تفاصيل الشرح المطلوب</Label>
                  <p className="text-zinc-700 leading-relaxed font-medium text-lg">{selectedIstifham.description}</p>
                </div>
                {selectedIstifham.goal && (
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs font-black text-accent">الهدف النهائي (شرط الإكمال)</Label>
                    <p className="text-zinc-800 font-black italic">"{selectedIstifham.goal}"</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-zinc-50 rounded-2xl border text-right space-y-1">
                  <Label className="text-[10px] font-black text-muted-foreground block uppercase">الميزانية المقترحة</Label>
                  <span className="font-black text-2xl text-green-600">{selectedIstifham.amount} ج.م</span>
                </div>
                <div className="p-5 bg-zinc-50 rounded-2xl border text-right space-y-1">
                  <Label className="text-[10px] font-black text-muted-foreground block uppercase">الموعد المطلوب</Label>
                  <span className="font-bold text-sm block">{new Date(selectedIstifham.meetingTime).toLocaleString('ar-EG')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button onClick={() => handleApproveIstifham(selectedIstifham)} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xl text-white shadow-xl">نشر الطلب فوراً</Button>
                <Button onClick={() => handleRejectIstifham(selectedIstifham.id)} variant="destructive" className="h-16 rounded-2xl font-black text-xl shadow-xl">رفض الطلب</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
