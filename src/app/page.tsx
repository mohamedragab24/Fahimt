
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert,
  LogOut,
  Scale,
  Wand2,
  Users,
  MessageSquare,
  X,
  Briefcase,
  ImageIcon,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy, addDoc, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { refineRequest } from "@/ai/flows/refine-request-flow";

export default function HomePage() {
  const { user, isUserLoading, auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const [appealReason, setAppealReason] = useState("");
  const [isSendingAppeal, setIsSendingAppeal] = useState(false);

  const handleSendAppeal = async () => {
    if (!appealReason.trim() || !firestore || !user) return;
    setIsSendingAppeal(true);
    try {
      await addDoc(collection(firestore, "appeals"), {
        userId: user.uid,
        userName: profile?.fullName || "مستخدم",
        userEmail: user.email,
        reason: appealReason,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      toast({ title: "تم إرسال الطعن", description: "سيتم مراجعة طلبك من قبل الإدارة." });
      setAppealReason("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsSendingAppeal(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return null;
  }

  if (!user || !profile) {
    return <LandingPage router={router} settings={settings} />;
  }

  if (profile.status === 'blocked') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50" dir="rtl">
        <Card className="w-full max-w-2xl shadow-2xl rounded-[3rem] border-t-8 border-red-600 overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-red-50">
            <CardTitle className="text-4xl font-black text-zinc-900">عذراً، تم حظر حسابك</CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-4">
              <h4 className="text-xl font-black flex items-center gap-2"><Scale className="text-red-600" /> تقديم طعن</h4>
              <Textarea placeholder="اكتب رسالتك..." className="h-40 rounded-xl" value={appealReason} onChange={(e) => setAppealReason(e.target.value)} />
              <Button onClick={handleSendAppeal} disabled={isSendingAppeal} className="w-full h-14 bg-red-600 font-bold">إرسال طعن</Button>
            </div>
            <Button variant="outline" onClick={() => signOut(auth).then(() => router.push("/login"))} className="w-full h-14 font-bold">خروج</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile.isProfileApproved && !profile.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50" dir="rtl">
        <Card className="w-full max-w-2xl shadow-2xl rounded-[4rem] border-t-8 border-orange-500 overflow-hidden bg-white text-center">
          <CardHeader className="pt-16 pb-10 space-y-6 text-center">
            <div className="bg-orange-100 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto text-orange-600 shadow-inner">
              <ShieldAlert size={80} className="animate-pulse" />
            </div>
            <CardTitle className="text-5xl font-black text-zinc-900">حسابك قيد المراجعة</CardTitle>
          </CardHeader>
          <CardContent className="px-12 pb-16 space-y-10">
            <p className="text-lg text-muted-foreground font-medium">نحن بصدد مراجعة بيانات ملفك الشخصي لضمان جودة المنصة. ستتلقى إشعاراً فور تفعيل حسابك.</p>
            <Button variant="outline" onClick={() => signOut(auth).then(() => router.push("/login"))} className="w-full h-16 rounded-2xl text-xl font-bold border-2">
              <LogOut className="ml-2 h-6 w-6" /> تسجيل الخروج والعودة لاحقاً
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-7xl mx-auto space-y-10" dir="rtl">
      <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-2 border-primary/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-right">
            <h1 className="text-2xl md:text-3xl font-black text-primary/80">أهلاً بك مجدداً</h1>
            <div className="flex items-center gap-4 justify-end md:justify-start">
              <span className="text-5xl md:text-7xl font-black text-primary tracking-tighter">{profile.fullName}</span>
              {profile.isVerified && <ShieldCheck className="text-blue-500 h-10 w-10" />}
            </div>
          </div>
          <div className="flex flex-col items-center bg-muted/20 p-8 rounded-3xl shrink-0">
            <Badge className="mt-2 px-6 py-2 text-md font-black">
              {profile.isAdmin ? "مسؤول النظام" : (profile.role === "mufhem" ? "مُفهم معتمد" : "مُستفهم طموح")}
            </Badge>
          </div>
        </div>
      </div>
      {profile.role === "mustafhem" ? <MustafhemView profile={profile} /> : <MufhemView profile={profile} />}
    </div>
  );
}

function LandingPage({ router, settings }: any) {
  const landingImage = settings?.landingBg || PlaceHolderImages.find(img => img.id === 'landing-bg')?.imageUrl || "";
  return (
    <div className="relative min-h-screen bg-black font-body overflow-hidden flex flex-col" dir="rtl">
      <div className="absolute inset-0 z-0">
        <Image src={landingImage} alt="Background" fill priority className="object-cover brightness-[0.4]" />
      </div>
      <header className="relative z-50 px-4 md:px-12 py-6 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/login')} className="bg-primary hover:bg-primary/90 text-white font-black rounded-full px-6 md:px-8">حساب جديد</Button>
          <Button variant="ghost" onClick={() => router.push('/login')} className="text-white bg-zinc-800/50 hover:bg-zinc-700/50 font-black rounded-full px-6 md:px-8">دخول</Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary font-black text-2xl md:text-3xl hidden sm:block">{settings?.siteTitle || "فهمني"}</span>
          <div className="bg-primary w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-xl overflow-hidden">
            {settings?.miniIconUrl ? <img src={settings.miniIconUrl} className="w-full h-full object-cover" /> : "ف"}
          </div>
        </div>
      </header>
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-1 py-32">
        <div className="max-w-5xl space-y-8 md:space-y-12">
          <h1 className="text-4xl md:text-8xl font-black text-white leading-tight tracking-tight">{settings?.heroTitle || "اول منصة عربية لخدمات الشرح الفوري"}</h1>
          <p className="text-xl md:text-4xl text-zinc-300 font-bold opacity-90">{settings?.heroSubtitle || "شروحات مباشرة تقدم خصيصاً من أجلك"}</p>
          <Button onClick={() => router.push('/login')} className="h-14 md:h-20 px-10 md:px-16 text-lg md:text-2xl font-black bg-primary hover:bg-primary/90 rounded-2xl md:rounded-[2rem] shadow-xl">ابدأ التعلم الآن</Button>
        </div>
      </main>
    </div>
  );
}

function MustafhemView({ profile }: any) {
  const firestore = useFirestore();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [newIstifham, setNewIstifham] = useState({ title: "", description: "", amount: "", category: "", categorySub: "", categoryOption: "", meetingTime: "", attachmentUrl: "" });
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "categories"), orderBy("createdAt", "desc")) : null, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const pendingIstifhamsQuery = useMemoFirebase(() => (firestore && profile.id) ? query(collection(firestore, "istifhams"), where("mustafhemId", "==", profile.id), where("status", "==", "pending_approval"), limit(10)) : null, [firestore, profile.id]);
  const { data: pendingIstifhams } = useCollection(pendingIstifhamsQuery);

  const featuredTeachersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "users"), where("role", "==", "mufhem"), where("isVerified", "==", true), limit(4)) : null, [firestore]);
  const { data: featuredTeachers } = useCollection(featuredTeachersQuery);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const filteredSubs = allCategories?.filter(c => c.type === 'sub' && c.parentId === allCategories?.find(m => m.name === newIstifham.category)?.id) || [];

  const handleRefine = async () => {
    if (!newIstifham.description) return;
    setIsRefining(true);
    try {
      const result = await refineRequest({ text: newIstifham.description });
      setNewIstifham(prev => ({ ...prev, title: result.refinedTitle, description: result.refinedDescription }));
      toast({ title: "تم التحسين" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCreate = async () => {
    if (!newIstifham.title || !newIstifham.description || !newIstifham.category || !newIstifham.amount || !newIstifham.meetingTime) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }
    if (firestore && profile) {
      await addDoc(collection(firestore, "istifhams"), {
        ...newIstifham,
        amount: Number(newIstifham.amount),
        status: "pending_approval",
        mustafhemId: profile.id,
        mustafhemName: profile.fullName || "مستخدم",
        mustafhemGender: profile.gender || "male",
        createdAt: new Date().toISOString()
      });
      setIsDialogOpen(false);
      setNewIstifham({ title: "", description: "", amount: "", category: "", categorySub: "", categoryOption: "", meetingTime: "", attachmentUrl: "" });
      toast({ title: "تم الإرسال للمراجعة" });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2">
        <div className="space-y-4 text-right">
          <h2 className="text-4xl font-black text-zinc-800">عندك سؤال؟ اطرح استفهامك الآن</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl">طلب استفهام جديد</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[650px] rounded-[3rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-3xl font-black">تفاصيل الاستفهام</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6 max-h-[60vh] overflow-y-auto px-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <Label className="font-black">وصف الطلب</Label>
                    <Button variant="ghost" size="sm" onClick={handleRefine} disabled={isRefining} className="text-primary font-black"><Wand2 className="h-4 w-4 ml-2" /> تحسين بالذكاء الاصطناعي</Button>
                  </div>
                  <Textarea placeholder="اشرح مشكلتك..." value={newIstifham.description} onChange={(e)=>setNewIstifham({...newIstifham, description: e.target.value})} className="h-32 rounded-2xl border-2" />
                </div>
                <Input placeholder="عنوان الاستفهام" value={newIstifham.title} onChange={(e)=>setNewIstifham({...newIstifham, title: e.target.value})} className="h-14 rounded-2xl border-2 font-bold" />
                <div className="grid grid-cols-2 gap-6">
                  <Select onValueChange={(v)=>setNewIstifham({...newIstifham, category: v, categorySub: ""})}>
                    <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue placeholder="القسم" /></SelectTrigger>
                    <SelectContent>{mainCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select onValueChange={(v)=>setNewIstifham({...newIstifham, categorySub: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue placeholder="التخصص" /></SelectTrigger>
                    <SelectContent>{filteredSubs.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Input type="number" placeholder="الميزانية" value={newIstifham.amount} onChange={(e)=>setNewIstifham({...newIstifham, amount: e.target.value})} className="h-14 rounded-2xl border-2" />
                  <Input type="datetime-local" value={newIstifham.meetingTime} onChange={(e)=>setNewIstifham({...newIstifham, meetingTime: e.target.value})} className="h-14 rounded-2xl border-2" />
                </div>
              </div>
              <DialogFooter><Button onClick={handleCreate} className="w-full h-16 text-xl font-black rounded-2xl">تأكيد وإرسال للمراجعة</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <BookOpen size={120} className="text-primary opacity-20 hidden md:block" />
      </div>
      <div className="space-y-6">
        <h3 className="text-2xl font-black border-r-8 border-accent pr-6">خبراء متميزون</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTeachers?.map(t => (
            <Card key={t.id} className="rounded-[2.5rem] border-2 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push(`/teachers`)}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <img src={t.profilePictureUrl || "https://picsum.photos/seed/avatar/200/200"} width={80} height={80} alt="T" className="rounded-3xl border-4 border-white shadow-lg mb-4" />
                <h4 className="font-black text-lg">{t.fullName}</h4>
                <p className="text-xs font-bold text-muted-foreground">{t.specialization || "خبير تعليمي"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {pendingIstifhams && pendingIstifhams.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black border-r-8 border-orange-500 pr-6">بانتظار المراجعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingIstifhams.map(ist => (
              <Card key={ist.id} className="rounded-[2.5rem] border-2 border-orange-100 bg-white p-6 shadow-lg">
                <Badge className="bg-orange-100 text-orange-600 mb-4">قيد المراجعة</Badge>
                <h4 className="text-xl font-black line-clamp-1">{ist.title}</h4>
                <div className="pt-4 border-t border-dashed mt-4 flex justify-between items-center">
                  <span className="font-black text-primary">{ist.amount} ج.م</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MufhemView({ profile }: any) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({ balance: 0, completed: 0, rating: 5.0 });

  const istifhamsQuery = useMemoFirebase(() => (firestore && profile?.gender) ? query(collection(firestore, "istifhams"), where("status", "==", "active"), where("mustafhemGender", "==", profile.gender)) : null, [firestore, profile?.gender]);
  const { data: istifhams, isLoading } = useCollection(istifhamsQuery);

  useEffect(() => {
    const fetchStats = async () => {
      if (!firestore || !profile.id) return;
      const txSnap = await getDocs(collection(firestore, "users", profile.id, "transactions"));
      let bal = 0;
      txSnap.forEach(doc => {
        const d = doc.data();
        if (d.status !== 'rejected') {
          if (d.type === 'deposit' || d.type === 'earning') bal += d.amount;
          else bal -= d.amount;
        }
      });
      const istSnap = await getDocs(query(collection(firestore, "istifhams"), where("mufhemId", "==", profile.id), where("status", "==", "completed")));
      setStats({ balance: bal, completed: istSnap.size, rating: 5.0 });
    };
    fetchStats();
  }, [firestore, profile.id]);

  const handleAccept = (ist: any) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, "istifhams", ist.id), { status: "accepted", mufhemId: profile.id, mufhemName: profile.fullName });
    toast({ title: "تم قبول الطلب" });
    router.push(`/requests/${ist.id}`);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80 text-right">الرصيد المتاح</p>
          <h3 className="text-5xl font-black text-right">{stats.balance} ج.م</h3>
        </Card>
        <Card className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-xl text-right">
          <p className="font-bold opacity-80">إنجازاتك</p>
          <h3 className="text-5xl font-black">{stats.completed} استفهام</h3>
        </Card>
        <Card className="bg-accent text-white rounded-[2.5rem] p-8 shadow-xl text-right">
          <p className="font-bold opacity-80">التقييم</p>
          <h3 className="text-5xl font-black">{stats.rating.toFixed(1)}</h3>
        </Card>
      </div>

      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 border-accent/10">
        <div className="space-y-4 text-right">
          <h2 className="text-4xl font-black text-zinc-800">اعرض مهاراتك.. أضف عملاً جديداً لمعرضك</h2>
          <p className="text-muted-foreground font-bold text-lg max-w-xl">كلما زادت أعمالك المميزة في المعرض، زادت ثقة الطلاب باختيارك لمشاريعهم.</p>
          <Button size="lg" onClick={() => router.push('/portfolio/add')} className="h-16 px-10 text-xl font-black rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
            إضافة عمل جديد للمعرض <Plus className="mr-2" />
          </Button>
        </div>
        <ImageIcon size={120} className="text-accent opacity-20 hidden md:block" />
      </div>

      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b"><h3 className="text-xl font-black">الاستفهامات المتاحة</h3></div>
        <div className="divide-y">
          {isLoading ? <div className="p-20 text-center animate-pulse">جاري التحميل...</div> : istifhams?.map(ist => (
            <div key={ist.id} className="p-6 hover:bg-zinc-50 transition-all cursor-pointer" onClick={() => router.push(`/requests/${ist.id}`)}>
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-primary">{ist.title}</h4>
                <p className="text-zinc-600 text-sm line-clamp-2">{ist.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-2xl font-black text-primary">{ist.amount} ج.م</span>
                  <Button onClick={(e) => { e.stopPropagation(); handleAccept(ist); }} className="rounded-xl font-bold px-8">أنا أفهمك</Button>
                </div>
              </div>
            </div>
          ))}
          {istifhams?.length === 0 && <div className="py-20 text-center text-zinc-400 font-bold">لا توجد طلبات جديدة حالياً.</div>}
        </div>
      </div>
    </div>
  );
}
