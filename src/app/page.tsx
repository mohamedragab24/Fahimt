
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  XCircle,
  LogOut,
  Scale,
  Zap,
  CheckCircle2,
  FileText,
  BadgeCent,
  Calendar as CalendarIcon,
  Layers,
  Filter,
  CheckCircle,
  Wand2,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy, addDoc, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
      toast({ title: "تم إرسال الطعن", description: "سيتم مراجعة طلبك من قبل الإدارة والرد عليك قريباً." });
      setAppealReason("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الطعن." });
    } finally {
      setIsSendingAppeal(false);
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-black animate-pulse text-primary text-2xl">جاري تحميل منصة فهمني...</div>;

  if (!user || !profile) {
    return <LandingPage router={router} settings={settings} />;
  }

  if (profile.status === 'blocked') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50" dir="rtl">
        <Card className="w-full max-w-2xl shadow-2xl rounded-[3rem] border-t-8 border-red-600 overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-red-50">
            <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-red-600 mb-6">
              <XCircle size={60} />
            </div>
            <CardTitle className="text-4xl font-black text-zinc-900">عذراً، تم حظر حسابك</CardTitle>
            <CardDescription className="text-xl text-zinc-600 font-bold mt-4">
              لقد تم تعطيل وصولك للمنصة لانتهاك السياسات أو عدم استيفاء الشروط.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-4">
              <h4 className="text-xl font-black flex items-center gap-2">
                <Scale className="text-red-600" /> تقديم طعن للإدارة
              </h4>
              <Textarea 
                placeholder="اكتب رسالتك هنا بالتفصيل..." 
                className="h-40 rounded-xl text-lg p-4 border-2" 
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
              />
              <Button onClick={handleSendAppeal} disabled={isSendingAppeal} className="w-full h-14 bg-red-600">إرسال طعن</Button>
            </div>
            <Button variant="outline" onClick={() => signOut(auth).then(() => router.push("/login"))} className="w-full h-14">خروج</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile.isProfileApproved && !profile.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50" dir="rtl">
        <Card className="w-full max-w-2xl shadow-2xl rounded-[4rem] border-t-8 border-orange-500 overflow-hidden bg-white text-center">
          <CardHeader className="pt-16 pb-10 space-y-6">
            <div className="bg-orange-100 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto text-orange-600 shadow-inner">
              <ShieldAlert size={80} className="animate-pulse" />
            </div>
            <CardTitle className="text-5xl font-black text-zinc-900">حسابك قيد المراجعة</CardTitle>
            <CardDescription className="text-2xl text-zinc-600 font-bold max-w-md mx-auto">
              أهلاً بك في فهمني. يقوم فريق الإدارة حالياً بمراجعة بياناتك وصورتك لضمان جودة المنصة.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-12 pb-16 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-muted/20 rounded-3xl border-2 border-dashed space-y-2">
                <Clock className="mx-auto text-orange-500" />
                <p className="font-bold">مدة الانتظار</p>
                <p className="text-sm text-muted-foreground">عادة ما يتم تفعيل الحساب خلال 2-12 ساعة عمل.</p>
              </div>
              <div className="p-6 bg-muted/20 rounded-3xl border-2 border-dashed space-y-2">
                <CheckCircle2 className="mx-auto text-green-500" />
                <p className="font-bold">ماذا بعد التفعيل؟</p>
                <p className="text-sm text-muted-foreground">ستتمكن من إنشاء الاستفهامات أو قبولها مباشرة.</p>
              </div>
            </div>
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
    <div className="min-h-screen bg-white font-body" dir="rtl">
      <header className="absolute top-0 left-0 w-full z-50 px-6 md:px-16 py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/login')} className="bg-primary font-black rounded-full px-8 py-6 text-lg">حساب جديد</Button>
          <Button variant="ghost" onClick={() => router.push('/login')} className="text-white font-black text-lg">دخول</Button>
        </div>
        <div className="flex items-center">
          {settings?.logoUrl && (
            <img src={settings.logoUrl} className="h-28 w-auto object-contain" alt="Logo" style={{ maxHeight: '120px' }} />
          )}
        </div>
      </header>

      <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={landingImage} alt="Bg" className="w-full h-full object-cover brightness-[0.3]" />
        </div>
        <div className="relative z-10 space-y-8 max-w-5xl px-4">
          <h1 className="text-6xl md:text-8xl font-black text-white leading-tight">{settings?.heroTitle || "أول منصة عربية لخدمات الشرح الفوري"}</h1>
          <p className="text-2xl md:text-4xl text-zinc-200 font-bold opacity-90">{settings?.heroSubtitle || "مُفهمين خبراء لخدمة كل مُستفهم طموح"}</p>
          <Button onClick={() => router.push('/login')} className="h-20 px-16 text-3xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-all">ابدأ رحلتك الآن</Button>
        </div>
      </section>
    </div>
  );
}

function MustafhemView({ profile }: any) {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [newIstifham, setNewIstifham] = useState({ 
    title: "", 
    description: "", 
    amount: "", 
    category: "", 
    categorySub: "", 
    categoryOption: "", 
    meetingTime: "" 
  });
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const pendingIstifhamsQuery = useMemoFirebase(() => {
    if (!firestore || !profile.id) return null;
    return query(collection(firestore, "istifhams"), where("mustafhemId", "==", profile.id), where("status", "==", "pending_approval"), limit(10));
  }, [firestore, profile.id]);
  const { data: pendingIstifhams } = useCollection(pendingIstifhamsQuery);

  const featuredTeachersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mufhem"), where("isVerified", "==", true), limit(4));
  }, [firestore]);
  const { data: featuredTeachers } = useCollection(featuredTeachersQuery);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const filteredSubs = allCategories?.filter(c => c.type === 'sub' && c.parentId === allCategories?.find(m => m.name === newIstifham.category)?.id) || [];
  const filteredOptions = allCategories?.filter(c => c.type === 'option' && c.parentId === allCategories?.find(s => s.name === newIstifham.categorySub)?.id) || [];

  const handleRefine = async () => {
    if (!newIstifham.description) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى كتابة وصف بسيط أولاً ليقوم الذكاء الاصطناعي بتحسينه." });
      return;
    }
    setIsRefining(true);
    try {
      const result = await refineRequest({ text: newIstifham.description });
      setNewIstifham(prev => ({
        ...prev,
        title: result.refinedTitle,
        description: result.refinedDescription
      }));
      toast({ title: "تم التحسين بنجاح", description: "قام الذكاء الاصطناعي بصياغة طلبك بشكل احترافي." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الاتصال بمحرك الذكاء الاصطناعي." });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCreate = async () => {
    if (!newIstifham.title || !newIstifham.description || !newIstifham.category || !newIstifham.amount || !newIstifham.meetingTime) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة الحقول الأساسية للاستفهام." });
      return;
    }

    if (firestore) {
      await addDoc(collection(firestore, "istifhams"), {
        ...newIstifham,
        amount: Number(newIstifham.amount),
        status: "pending_approval",
        mustafhemId: profile.id,
        mustafhemName: profile.fullName,
        mustafhemGender: profile.gender,
        createdAt: new Date().toISOString()
      });

      setIsDialogOpen(false);
      setNewIstifham({ title: "", description: "", amount: "", category: "", categorySub: "", categoryOption: "", meetingTime: "" });
      toast({ title: "تم الإرسال للمراجعة", description: "سيتم مراجعة استفهامك ونشره خلال دقائق." });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2">
        <div className="space-y-4 text-right">
          <h2 className="text-4xl font-black text-zinc-800">عندك سؤال؟ <br/> اطرح استفهامك الآن</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-lg hover:scale-105 transition-all">طلب استفهام جديد</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] rounded-[3rem] border-none shadow-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
                  <Zap className="text-primary fill-primary/10" /> تفاصيل الاستفهام
                </DialogTitle>
                <DialogDescription className="text-right font-bold">اشرح ما تريد فهمه لنصلك بالخبير المناسب.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 max-h-[60vh] overflow-y-auto px-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <Label className="font-black">وصف الطلب</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefine}
                      disabled={isRefining}
                      className="text-primary font-black gap-2 hover:bg-primary/5"
                    >
                      {isRefining ? <Sparkles className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      تحسين بالذكاء الاصطناعي
                    </Button>
                  </div>
                  <Textarea placeholder="اكتب هنا تفاصيل ما تود فهمه بوضوح..." value={newIstifham.description} onChange={(e)=>setNewIstifham({...newIstifham, description: e.target.value})} required className="h-32 rounded-2xl border-2 p-4 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                  <Label className="font-black mr-2">عنوان الاستفهام</Label>
                  <Input placeholder="مثال: شرح درس المصفوفات" value={newIstifham.title} onChange={(e)=>setNewIstifham({...newIstifham, title: e.target.value})} required className="h-14 rounded-2xl border-2 font-bold" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black mr-2">القسم الرئيسي</Label>
                    <Select onValueChange={(v)=>setNewIstifham({...newIstifham, category: v, categorySub: "", categoryOption: ""})}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>
                        {mainCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black mr-2">التخصص</Label>
                    <Select disabled={!newIstifham.category} onValueChange={(v)=>setNewIstifham({...newIstifham, categorySub: v, categoryOption: ""})}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                      <SelectContent>
                        {filteredSubs.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black mr-2">الميزانية (ج.م)</Label>
                    <Input type="number" placeholder="0.00" value={newIstifham.amount} onChange={(e)=>setNewIstifham({...newIstifham, amount: e.target.value})} required className="h-14 rounded-2xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black mr-2">موعد المحاضرة</Label>
                    <Input type="datetime-local" value={newIstifham.meetingTime} onChange={(e)=>setNewIstifham({...newIstifham, meetingTime: e.target.value})} required className="h-14 rounded-2xl border-2" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} className="w-full h-16 text-xl font-black rounded-2xl shadow-xl">تأكيد وإرسال للمراجعة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <BookOpen size={120} className="text-primary opacity-20 hidden md:block" />
      </div>

      {/* Featured Teachers */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black border-r-8 border-accent pr-6 flex items-center gap-3">
          <Users className="text-accent" /> خبراء متميزون متاحون الآن
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTeachers?.map(t => (
            <Card key={t.id} className="rounded-[2.5rem] border-2 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="h-20 bg-accent/10"></div>
              <CardContent className="p-6 -mt-10 flex flex-col items-center text-center">
                <Image 
                  src={t.profilePictureUrl || "https://picsum.photos/seed/avatar/200/200"} 
                  width={80} 
                  height={80} 
                  alt="T" 
                  className="rounded-3xl border-4 border-white shadow-lg mb-4"
                />
                <h4 className="font-black text-lg flex items-center gap-1">{t.fullName} <ShieldCheck className="text-blue-500 h-4 w-4" /></h4>
                <p className="text-xs font-bold text-muted-foreground line-clamp-1">{t.specialization || "خبير تعليمي"}</p>
                <div className="flex items-center gap-1 text-yellow-500 font-black text-xs mt-3">
                  <Star size={12} className="fill-current" /> 5.0
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {pendingIstifhams && pendingIstifhams.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black border-r-8 border-orange-500 pr-6">استفهاماتك قيد المراجعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingIstifhams.map(ist => (
              <Card key={ist.id} className="rounded-[2.5rem] border-2 border-orange-100 bg-white shadow-lg overflow-hidden group">
                <div className="p-6 space-y-4">
                  <Badge className="bg-orange-100 text-orange-600 border-none font-bold">بانتظار موافقة الإدارة</Badge>
                  <h4 className="text-xl font-black text-zinc-800 line-clamp-1">{ist.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                    <Layers size={14} /> <span>{ist.category} › {ist.categorySub}</span>
                  </div>
                  <div className="pt-4 border-t border-dashed flex justify-between items-center">
                    <span className="font-black text-primary">{ist.amount} ج.م</span>
                    <span className="text-xs text-muted-foreground font-bold">{new Date(ist.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
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
  const { toast } = useToast();
  const [stats, setStats] = useState({ balance: 0, completed: 0, rating: 5.0 });

  const istifhamsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.gender) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "==", "active"),
      where("mustafhemGender", "==", profile.gender),
      limit(50)
    );
  }, [firestore, profile?.gender]);
  
  const { data: istifhams, isLoading } = useCollection(istifhamsQuery);

  useEffect(() => {
    const fetchMufhemStats = async () => {
      if (!firestore || !profile.id) return;
      
      const txRef = collection(firestore, "users", profile.id, "transactions");
      const txSnap = await getDocs(txRef);
      let bal = 0;
      txSnap.forEach(doc => {
        const d = doc.data();
        if (d.status !== 'rejected') {
          if (d.type === 'deposit' || d.type === 'earning') bal += d.amount;
          else bal -= d.amount;
        }
      });

      const istRef = collection(firestore, "istifhams");
      const istQuery = query(istRef, where("mufhemId", "==", profile.id), where("status", "==", "completed"));
      const istSnap = await getDocs(istQuery);

      setStats({
        balance: bal,
        completed: istSnap.size,
        rating: 5.0 // MVP default
      });
    };
    fetchMufhemStats();
  }, [firestore, profile.id]);

  const handleAccept = (ist: any) => {
    if (!firestore) return;
    const istRef = doc(firestore, "istifhams", ist.id);
    updateDocumentNonBlocking(istRef, {
      status: "accepted",
      mufhemId: profile.id,
      mufhemName: profile.fullName
    });

    addDocumentNonBlocking(collection(firestore, "notifications"), {
      userId: ist.mustafhemId,
      title: "تم قبول استفهامك!",
      message: `وافق المُفهم ${profile.fullName} على طلبك. يمكنك الآن دخول المحاضرة.`,
      type: "acceptance",
      read: false,
      createdAt: new Date().toISOString()
    });

    toast({ title: "تم قبول الطلب", description: "يمكنك الآن بدء المحاضرة مع الطالب." });
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80 text-right">الرصيد المتاح</p>
          <h3 className="text-5xl font-black tabular-nums text-right">{stats.balance} <span className="text-xl">ج.م</span></h3>
        </Card>
        <Card className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80 text-right">استفهامات منجزة</p>
          <h3 className="text-5xl font-black tabular-nums text-right">{stats.completed}</h3>
        </Card>
        <Card className="bg-accent text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80 text-right">تقييمك العام</p>
          <h3 className="text-5xl font-black tabular-nums text-right">{stats.rating.toFixed(1)}</h3>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-3xl font-black border-r-8 border-primary pr-6">استفهامات متاحة لك</h3>
        {isLoading ? <div className="text-center py-20 animate-pulse font-black">جاري جلب البيانات...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {istifhams?.map(ist => (
              <Card key={ist.id} className="p-8 rounded-[2.5rem] border-2 shadow-lg hover:border-primary transition-all bg-white group">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="px-3 py-1 font-bold bg-primary/10 text-primary">{ist.categorySub || ist.category}</Badge>
                  <span className="text-xs font-bold text-muted-foreground">{new Date(ist.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <h4 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors text-right">{ist.title}</h4>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 font-medium text-right">{ist.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-dashed">
                  <span className="font-black text-primary text-2xl">{ist.amount} <span className="text-xs">ج.م</span></span>
                  <Button onClick={() => handleAccept(ist)} className="rounded-xl font-black px-6">أنا أفهمك</Button>
                </div>
              </Card>
            ))}
            {istifhams?.length === 0 && (
              <div className="col-span-full py-20 text-center bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted-foreground/20">
                <p className="text-muted-foreground font-black text-xl opacity-40">لا توجد استفهامات جديدة حالياً.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
