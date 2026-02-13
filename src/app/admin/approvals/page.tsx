
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
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
  FileText
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

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com";
  const canReadApprovals = adminProfile?.isAdmin || isMasterAdmin;

  // جلب كافة المستخدمين غير المعتمدين بغض النظر عن الحالة لضمان الظهور
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !canReadApprovals) return null;
    return query(collection(firestore, "users"), where("isProfileApproved", "==", false));
  }, [firestore, canReadApprovals]);

  // جلب كافة الاستفهامات التي تنتظر الموافقة
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
      title: "تم اعتماد حسابك!",
      message: "تهانينا، تم مراجعة ملفك الشخصي بنجاح. يمكنك الآن استخدام كافة مميزات المنصة.",
      type: "approval",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ title: "تم الاعتماد", description: "تم تفعيل الملف وإرسال إشعار للمستخدم." });
    setSelectedUser(null);
  };

  const handleRejectProfile = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    updateDocumentNonBlocking(uRef, { status: "blocked" });
    toast({ variant: "destructive", title: "تم الرفض والحظر", description: "تم حظر الحساب لعدم استيفاء الشروط." });
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
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline text-zinc-900">مركز الاعتماد والرقابة</h1>
        <p className="text-muted-foreground text-lg">مراجعة الهويات والاستفهامات الجديدة قبل النشر لضمان الجودة.</p>
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 p-1 bg-muted rounded-2xl mb-8">
          <TabsTrigger value="profiles" className="rounded-xl text-lg font-bold">
            <User className="ml-2 h-5 w-5" /> مراجعة الحسابات ({profiles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="istifhams" className="rounded-xl text-lg font-bold">
            <MessageSquare className="ml-2 h-5 w-5" /> مراجعة الاستفهامات ({istifhams?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {profilesLoading ? <p className="col-span-full text-center font-bold animate-pulse">جاري تحميل الحسابات...</p> : 
              profiles?.map((p) => (
                <Card key={p.id} className="rounded-[2.5rem] overflow-hidden shadow-lg border-2 hover:border-primary/20 transition-all bg-white">
                  <CardHeader className="bg-muted/30 p-8 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl mb-4">
                      <AvatarImage src={p.profilePictureUrl} />
                      <AvatarFallback className="text-2xl font-black">{p.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-black text-xl">{p.fullName}</CardTitle>
                    <Badge variant="outline" className="mt-2 text-primary font-bold border-primary/20">
                      {p.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Button variant="outline" onClick={() => setSelectedUser(p)} className="w-full h-12 rounded-xl font-bold border-2"><Eye className="ml-2 h-5 w-5" /> عرض التفاصيل الكاملة</Button>
                    <div className="flex gap-2">
                      <Button onClick={() => handleApproveProfile(p)} className="flex-1 bg-green-600 hover:bg-green-700 font-bold rounded-xl h-12 text-white"><CheckCircle2 className="ml-2 h-5 w-5" /> اعتماد</Button>
                      <Button onClick={() => handleRejectProfile(p)} variant="destructive" className="flex-1 font-bold rounded-xl h-12"><XCircle className="ml-2 h-5 w-5" /> رفض</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
            {!profilesLoading && profiles?.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد حسابات جديدة للمراجعة حالياً.</div>}
          </div>
        </TabsContent>

        <TabsContent value="istifhams">
          <div className="grid gap-6">
            {istifhamsLoading ? <p className="text-center font-bold animate-pulse">جاري تحميل الاستفهامات...</p> :
              istifhams?.map((ist) => (
                <Card key={ist.id} className="rounded-3xl border-2 p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 bg-white group">
                  <div className="space-y-2 text-right w-full">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-none font-bold">{ist.category}</Badge>
                      <span className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock size={12}/> {new Date(ist.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                    <h4 className="text-2xl font-black text-zinc-800 group-hover:text-primary transition-colors">{ist.title}</h4>
                    <p className="font-bold text-muted-foreground">بواسطة المُستفهم: <span className="text-zinc-900">{ist.mustafhemName}</span></p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto shrink-0">
                    <Button variant="outline" onClick={() => setSelectedIstifham(ist)} className="h-14 px-8 font-black rounded-2xl border-2"><Eye className="ml-2 h-5 w-5" /> تفاصيل الاستفهام</Button>
                    <Button onClick={() => handleApproveIstifham(ist)} className="bg-green-600 hover:bg-green-700 h-14 px-8 font-black rounded-2xl shadow-lg text-white">نشر الآن</Button>
                  </div>
                </Card>
              ))
            }
            {!istifhamsLoading && istifhams?.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد استفهامات جديدة للمراجعة حالياً.</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* مودال تفاصيل المستخدم */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3"><UserCircle className="text-primary h-8 w-8" /> تفاصيل الحساب</DialogTitle>
            <DialogDescription className="text-right text-lg">مراجعة بيانات {selectedUser?.role === 'mufhem' ? 'المُفهم' : 'المُستفهم'} بالكامل قبل الاعتماد.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto px-2">
              <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-3xl border-2 border-dashed">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedUser.profilePictureUrl} />
                  <AvatarFallback className="text-2xl font-black">{selectedUser.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-2xl font-black">{selectedUser.fullName}</h4>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary">{selectedUser.gender === 'male' ? 'ذكر' : 'أنثى'}</Badge>
                    <Badge className="bg-accent/10 text-accent">{selectedUser.role === 'mufhem' ? 'خبير تعليمي' : 'طالب علم'}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailBox icon={Mail} label="البريد الإلكتروني" value={selectedUser.email} />
                <DetailBox icon={Phone} label="رقم الهاتف" value={selectedUser.phoneNumber} />
                <DetailBox icon={Calendar} label="تاريخ الميلاد" value={new Date(selectedUser.birthDate).toLocaleDateString('ar-EG')} />
                <DetailBox icon={Clock} label="تاريخ التسجيل" value={new Date(selectedUser.createdAt).toLocaleDateString('ar-EG')} />
              </div>
              {selectedUser.role === 'mufhem' && (
                <div className="space-y-4">
                  <Label className="text-xl font-black">التخصص والنبذة</Label>
                  <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed italic">
                    <p className="font-black text-primary mb-2">{selectedUser.specialization || "غير محدد"}</p>
                    <p className="text-muted-foreground leading-relaxed">"{selectedUser.bio || "لا توجد نبذة"}"</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button onClick={() => handleApproveProfile(selectedUser)} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xl text-white">اعتماد الحساب</Button>
                <Button onClick={() => handleRejectProfile(selectedUser)} variant="destructive" className="h-16 rounded-2xl font-black text-xl">رفض وحظر</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مودال تفاصيل الاستفهام */}
      <Dialog open={!!selectedIstifham} onOpenChange={() => setSelectedIstifham(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3"><HelpCircle className="text-primary h-8 w-8" /> تفاصيل الاستفهام</DialogTitle>
            <DialogDescription className="text-right text-lg">مراجعة محتوى الاستفهام والميزانية قبل نشره للمُفهمين.</DialogDescription>
          </DialogHeader>
          {selectedIstifham && (
            <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto px-2">
              <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4">
                <h4 className="text-2xl font-black text-primary leading-tight">{selectedIstifham.title}</h4>
                <div className="flex items-start gap-2">
                  <FileText className="text-muted-foreground shrink-0 mt-1" size={18} />
                  <p className="text-zinc-700 leading-relaxed font-medium">{selectedIstifham.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailBox icon={BadgeCent} label="الميزانية المقترحة" value={`${selectedIstifham.amount} ج.م`} />
                <DetailBox icon={Calendar} label="موعد المحاضرة" value={new Date(selectedIstifham.meetingTime).toLocaleString('ar-EG')} />
                <DetailBox icon={User} label="المُستفهم" value={selectedIstifham.mustafhemName} />
                <DetailBox icon={MapPin} label="القسم والتخصص" value={`${selectedIstifham.category} > ${selectedIstifham.categorySub || 'عام'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button onClick={() => handleApproveIstifham(selectedIstifham)} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xl shadow-lg text-white">اعتماد ونشر فوراً</Button>
                <Button onClick={() => handleRejectIstifham(selectedIstifham.id)} variant="destructive" className="h-16 rounded-2xl font-black text-xl shadow-lg text-white">رفض الاستفهام</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailBox({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 bg-muted/10 rounded-2xl border flex items-center gap-4">
      <div className="bg-white p-2 rounded-lg shadow-sm text-primary"><Icon size={20} /></div>
      <div>
        <span className="text-[10px] font-black text-muted-foreground block uppercase">{label}</span>
        <span className="font-bold text-sm">{value}</span>
      </div>
    </div>
  );
}
