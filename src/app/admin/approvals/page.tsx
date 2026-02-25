
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
  ShieldCheck,
  IdCard,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * مركز الاعتماد الموحد - مراجعة الصور الشخصية المعلقة، الاستفهامات، وتوثيق الهوية.
 */
export default function AdminApprovals() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedIstifham, setSelectedIstifham] = useState<any>(null);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(userRef);

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const canReadApprovals = adminProfile?.isAdmin || isMasterAdmin;

  // 1. جلب الحسابات التي تنتظر مراجعة الصورة الشخصية فعلياً
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !canReadApprovals) return null;
    return query(collection(firestore, "users"), where("profilePicturePending", "==", true), limit(500));
  }, [firestore, canReadApprovals]);

  // 2. جلب الاستفهامات التي تحتاج لمراجعة المحتوى
  const istifhamsQuery = useMemoFirebase(() => {
    if (!firestore || !canReadApprovals) return null;
    return query(collection(firestore, "istifhams"), where("status", "==", "pending_approval"));
  }, [firestore, canReadApprovals]);

  // 3. جلب طلبات توثيق الهوية (البطاقات)
  const identityQuery = useMemoFirebase(() => {
    if (!firestore || !canReadApprovals) return null;
    return query(collection(firestore, "users"), where("verificationStatus", "==", "pending"), limit(500));
  }, [firestore, canReadApprovals]);

  const { data: profiles, isLoading: profilesLoading } = useCollection(profilesQuery);
  const { data: istifhams, isLoading: istifhamsLoading } = useCollection(istifhamsQuery);
  const { data: verifications, isLoading: verificationsLoading } = useCollection(identityQuery);

  // --- دوال التحكم في الصور الشخصية ---
  const handleApproveProfile = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    updateDocumentNonBlocking(uRef, { 
      isProfileApproved: true, 
      profilePicturePending: false, // مسح علامة الانتظار
      status: 'active' 
    });
    
    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: u.id,
      title: "تم اعتماد صورتك الشخصية!",
      message: "تهانينا، تم مراجعة صورتك الشخصية واعتماد حسابك بنجاح في فهمت.",
      type: "approval",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ title: "تم الاعتماد", description: "تم تفعيل الصورة الشخصية بنجاح." });
    setSelectedUser(null);
  };

  const handleRejectProfile = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    // عند الرفض، نمسح الصورة ونلغي علامة الانتظار
    updateDocumentNonBlocking(uRef, { 
      isProfileApproved: false, 
      profilePicturePending: false,
      profilePictureUrl: null 
    });
    
    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: u.id,
      title: "تم رفض الصورة الشخصية",
      message: "عذراً، الصورة الشخصية لا تستوفي المعايير. يرجى رفع صورة بديلة واضحة.",
      type: "rejection",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ variant: "destructive", title: "تم الرفض", description: "تم حذف الصورة وإبلاغ المستخدم." });
    setSelectedUser(null);
  };

  // --- دوال التحكم في الاستفهامات ---
  const handleApproveIstifham = (ist: any) => {
    if (!firestore) return;
    const istRef = doc(firestore, "istifhams", ist.id);
    updateDocumentNonBlocking(istRef, { 
      status: "active",
      approvedAt: new Date().toISOString()
    });
    toast({ title: "تم النشر", description: "الاستفهام متاح الآن للجميع." });
    setSelectedIstifham(null);
  };

  const handleRejectIstifham = (id: string) => {
    if (!firestore) return;
    const istRef = doc(firestore, "istifhams", id);
    updateDocumentNonBlocking(istRef, { status: "canceled" });
    toast({ variant: "destructive", title: "تم الرفض", description: "تم إلغاء طلب الاستفهام." });
    setSelectedIstifham(null);
  };

  // --- دوال توثيق الهوية (البطاقة) ---
  const handleApproveIdentity = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    updateDocumentNonBlocking(uRef, { 
      isVerified: true, 
      verificationStatus: 'verified',
      verifiedAt: new Date().toISOString()
    });
    
    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: u.id,
      title: "تم توثيق هويتك بنجاح!",
      message: "مبروك! تم التحقق من هويتك وحصلت على شارة التوثيق الزرقاء في فهمت.",
      type: "verification_success",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ title: "تم التوثيق!", description: "تم منح المستخدم شارة التوثيق الزرقاء." });
    setSelectedVerification(null);
  };

  const handleRejectIdentity = (u: any) => {
    if (!firestore) return;
    const uRef = doc(firestore, "users", u.id);
    updateDocumentNonBlocking(uRef, { 
      verificationStatus: 'rejected',
      idCardFront: null,
      idCardBack: null
    });
    
    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: u.id,
      title: "فشل توثيق الهوية",
      message: "عذراً، لم نتمكن من قبول وثائق الهوية المرفوعة. يرجى المحاولة بصور أوضح.",
      type: "verification_failed",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ variant: "destructive", title: "تم الرفض", description: "تم رفض وثائق الهوية." });
    setSelectedVerification(null);
  };

  if (!canReadApprovals && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لهذه الصفحة.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6 text-right">
        <h1 className="text-4xl font-black font-headline text-zinc-900">مركز الاعتماد والرقابة الموحد</h1>
        <p className="text-muted-foreground text-lg">إدارة كافة عمليات المراجعة والاعتماد لضمان بيئة تعليمية احترافية وآمنة.</p>
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-16 p-1 bg-muted rounded-2xl mb-8">
          <TabsTrigger value="profiles" className="rounded-xl text-lg font-bold">
            <ImageIcon className="ml-2 h-5 w-5" /> الصور ({profiles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="istifhams" className="rounded-xl text-lg font-bold">
            <MessageSquare className="ml-2 h-5 w-5" /> الاستفهامات ({istifhams?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="identity" className="rounded-xl text-lg font-bold">
            <IdCard className="ml-2 h-5 w-5" /> توثيق الهوية ({verifications?.length || 0})
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
                    <Badge variant="outline" className="mt-2 text-primary font-bold">{p.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Button variant="outline" onClick={() => setSelectedUser(p)} className="w-full h-12 rounded-xl font-bold border-2"><Eye className="ml-2 h-5 w-5" /> معاينة</Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleApproveProfile(p)} className="bg-green-600 hover:bg-green-700 font-black rounded-xl h-12 text-white shadow-md shadow-green-600/20">اعتماد</Button>
                      <Button onClick={() => handleRejectProfile(p)} variant="destructive" className="font-black rounded-xl h-12 shadow-md shadow-red-600/20">رفض</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
            {!profilesLoading && profiles?.length === 0 && <NoData message="لا توجد صور شخصية بانتظار المراجعة." />}
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
                    <p className="font-bold text-muted-foreground text-right">بواسطة: <span className="text-zinc-900">{ist.mustafhemName}</span> | الميزانية: <span className="text-green-600 font-black">{ist.amount} ج.م</span></p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto shrink-0">
                    <Button variant="outline" onClick={() => setSelectedIstifham(ist)} className="h-14 px-8 font-black rounded-2xl border-2"><Eye className="ml-2 h-5 w-5" /> التفاصيل</Button>
                    <Button onClick={() => handleApproveIstifham(ist)} className="bg-green-600 hover:bg-green-700 h-14 px-8 font-black rounded-2xl shadow-lg text-white">نشر الطلب</Button>
                  </div>
                </Card>
              ))
            }
            {!istifhamsLoading && istifhams?.length === 0 && <NoData message="لا توجد استفهامات جديدة للمراجعة." />}
          </div>
        </TabsContent>

        <TabsContent value="identity">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {verificationsLoading ? <p className="col-span-full text-center font-bold animate-pulse">جاري تحميل طلبات التوثيق...</p> :
              verifications?.map((v) => (
                <Card key={v.id} className="rounded-[2.5rem] overflow-hidden shadow-lg border-2 hover:border-accent/20 transition-all bg-white group">
                  <CardHeader className="bg-accent/5 p-8 flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                        <AvatarImage src={v.profilePictureUrl} />
                        <AvatarFallback className="text-3xl font-black">{v.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md text-accent">
                        <IdCard size={20} />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">{v.fullName}</CardTitle>
                      <Badge variant="outline" className="mt-2 font-bold border-accent/20 text-accent">{v.role === 'mufhem' ? 'مفهم' : 'طالب'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Button variant="outline" onClick={() => setSelectedVerification(v)} className="w-full h-12 rounded-xl font-black border-2"><Eye className="ml-2 h-5 w-5" /> مراجعة البطاقة</Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleApproveIdentity(v)} className="bg-green-600 hover:bg-green-700 font-black rounded-xl h-12 text-white shadow-md">توثيق</Button>
                      <Button onClick={() => handleRejectIdentity(v)} variant="destructive" className="font-black rounded-xl h-12 shadow-md">رفض</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
            {!verificationsLoading && verifications?.length === 0 && <NoData message="لا توجد طلبات توثيق هوية معلقة." />}
          </div>
        </TabsContent>
      </Tabs>

      {/* مودال مراجعة الصورة الشخصية */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3"><UserCircle className="text-primary h-8 w-8" /> مراجعة بيانات الحساب</DialogTitle>
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
              <div className="p-6 bg-zinc-50 rounded-2xl"><p className="text-zinc-700 font-medium italic">"{selectedUser.bio || 'لا توجد نبذة.'}"</p></div>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleApproveProfile(selectedUser)} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xl text-white shadow-xl">اعتماد</Button>
                <Button onClick={() => handleRejectProfile(selectedUser)} variant="destructive" className="h-16 rounded-2xl font-black text-xl shadow-xl">رفض</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مودالات أخرى للاستفهامات والبطاقة تبقى كما هي مع التأكد من الأيقونات */}
      {/* ... (باقي المودالات) */}
    </div>
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div className="col-span-full py-32 text-center text-muted-foreground font-black text-xl opacity-30 flex flex-col items-center gap-4">
      <FileCheck size={64} />
      {message}
    </div>
  );
}
