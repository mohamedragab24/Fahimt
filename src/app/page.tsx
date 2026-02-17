
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
  Plus,
  Target,
  FileText,
  Clock,
  Timer,
  Video,
  Calendar,
  BellRing,
  Play,
  Search,
  ArrowRight,
  GraduationCap,
  Layout,
  HelpCircle,
  BadgeCent,
  Zap,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy, addDoc, getDocs, getDoc } from "firebase/firestore";
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
import { sendNotification } from "@/ai/flows/messaging-flow";

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </div>
    );
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

  const verifiedBadgeUrl = settings?.verifiedBadgeUrl || PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;

  return (
    <div className="p-4 md:p-10 max-7xl mx-auto space-y-10" dir="rtl">
      <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-2 border-primary/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-right">
            <h1 className="text-2xl md:text-3xl font-black text-primary/80">أهلاً بك مجدداً</h1>
            <div className="flex items-center gap-4 justify-end md:justify-start">
              <span className="text-5xl md:text-7xl font-black text-primary tracking-tighter">{profile.fullName}</span>
              {profile.isVerified && (
                <img src={verifiedBadgeUrl} alt="Verified" className="h-10 w-10" data-ai-hint="verified badge" />
              )}
            </div>
          </div>
          <div className="flex flex-col items-center bg-muted/20 p-8 rounded-3xl shrink-0">
            <Badge className="mt-2 px-6 py-2 text-md font-black">
              {profile.isAdmin ? "مسؤول النظام" : (profile.role === "mufhem" ? "مُفهم معتمد" : "مُستفهم طموح")}
            </Badge>
          </div>
        </div>
      </div>
      {profile.role === "mustafhem" ? <MustafhemView profile={profile} settings={settings} /> : <MufhemView profile={profile} settings={settings} />}
    </div>
  );
}

function LandingPage({ router, settings }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const firestore = useFirestore();

  const landingImage = settings?.landingBg || PlaceHolderImages.find(img => img.id === 'landing-bg')?.imageUrl || "";

  useEffect(() => {
    if (!firestore || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = query(collection(firestore, "istifhams"), where("status", "==", "active"), limit(5));
        const snap = await getDocs(q);
        const results = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((ist: any) => ist.title?.toLowerCase().includes(searchTerm.toLowerCase()));
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, firestore]);

  return (
    <div className="relative min-h-screen bg-white font-body overflow-x-hidden flex flex-col" dir="rtl">
      <div className="relative min-h-[95vh] flex flex-col">
        <div className="absolute inset-0 z-0">
          <Image src={landingImage} alt="Background" fill priority className="object-cover brightness-[0.3]" />
        </div>
        
        <header className="relative z-50 px-4 md:px-12 py-6 flex items-center justify-between bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="bg-primary w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-xl overflow-hidden border-2 border-white/20">
              {settings?.miniIconUrl ? <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="Logo" /> : "ف"}
            </div>
            <span className="text-white font-black text-2xl md:text-3xl hidden sm:block">{settings?.siteTitle || "فهمني"}</span>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden md:flex items-center gap-6 border-l border-white/10 pl-6">
              <LinkItem href="/teachers" icon={GraduationCap} label="المُفهمين" />
              <LinkItem href="/portfolio" icon={Layout} label="أعمال المفهمين" />
              <LinkItem href="/browse" icon={Search} label="تصفح الاستفهامات" />
            </nav>
            
            <div className="flex items-center gap-2 md:gap-3">
              <Button onClick={() => router.push('/login')} variant="ghost" className="text-white hover:bg-white/10 font-black rounded-full px-4 md:px-6 border border-white/20">دخول</Button>
              <Button onClick={() => router.push('/login')} className="bg-primary hover:bg-primary/90 text-white font-black rounded-full px-4 md:px-8">حساب جديد</Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-1 py-20">
          <div className="max-w-5xl space-y-10">
            <h1 className="text-4xl md:text-8xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
              {settings?.heroTitle || "اول منصة عربية لخدمات الشرح الفوري"}
            </h1>
            <p className="text-xl md:text-3xl text-zinc-200 font-bold opacity-90 max-w-3xl mx-auto">
              {settings?.heroSubtitle || "شروحات مباشرة تقدم خصيصاً من أجلك؛ ابحث عن أي سؤال الآن."}
            </p>

            <div className="relative max-w-4xl w-full mx-auto mt-12 group">
              <div className="flex flex-col md:flex-row gap-4 p-3 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all group-hover:border-primary/50">
                <div className="relative flex-1">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-6 w-6" />
                  <Input 
                    placeholder="ابحث عن أي موضوع أو سؤال يدور في ذهنك..." 
                    className="h-16 md:h-20 pr-16 rounded-[2rem] border-none bg-white text-xl font-bold shadow-inner placeholder:text-zinc-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => router.push('/browse')}
                  className="h-16 md:h-20 px-12 rounded-[2rem] bg-accent hover:bg-accent/90 text-xl font-black shadow-xl shadow-accent/20 transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="ml-2" /> استفهم الآن
                </Button>
              </div>

              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border-2 overflow-hidden z-[60] animate-in slide-in-from-top-4 duration-300">
                  <div className="p-4 bg-muted/30 border-b flex justify-between items-center px-8">
                    <span className="font-black text-primary text-sm">نتائج البحث عن: {searchTerm}</span>
                    {isSearching && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>}
                  </div>
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map(res => (
                        <div 
                          key={res.id} 
                          className="p-6 hover:bg-muted/50 cursor-pointer transition-colors text-right group"
                          onClick={() => router.push(`/requests/${res.id}`)}
                        >
                          <h4 className="font-black text-zinc-800 text-lg group-hover:text-primary transition-colors">{res.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{res.description}</p>
                          <div className="flex justify-between items-center mt-3">
                            <Badge variant="outline" className="font-black text-xs">{res.amount} ج.م</Badge>
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">سجل دخولك لمشاهدة التفاصيل <ArrowRight size={10} className="rotate-180" /></span>
                          </div>
                        </div>
                      ))
                    ) : !isSearching && (
                      <div className="p-12 text-center text-muted-foreground font-bold">لم نجد استفهامات مطابقة، كن أنت أول من يستفهم!</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {settings?.landingVideoId && (
        <section className="relative z-10 bg-zinc-50 py-24 px-6 md:py-32">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-6">
              <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-4">
                <Play size={48} className="fill-current" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tight">شاهد كيف يعمل <span className="text-primary">{settings?.siteTitle || "فهمني"}</span></h2>
              <p className="text-muted-foreground text-xl md:text-2xl font-bold max-w-3xl mx-auto">تعرف على رحلة "الفهم" في أقل من دقيقة عبر هذا الفيديو التوضيحي.</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 via-transparent to-accent/30 rounded-[4rem] blur-3xl opacity-40"></div>
              <div className="relative aspect-video w-full rounded-[3.5rem] md:rounded-[4.5rem] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.2)] border-[15px] md:border-[25px] border-white bg-black">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${settings.landingVideoId}?rel=0&modestbranding=1&hd=1&autoplay=0`}
                  title="How it works"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function LinkItem({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <a href={href} className="flex items-center gap-2 text-white/80 hover:text-white font-black text-sm transition-all group">
      <div className="bg-white/10 p-2 rounded-lg group-hover:bg-primary/20 group-hover:scale-110 transition-all">
        <Icon size={16} className="group-hover:text-primary" />
      </div>
      {label}
    </a>
  );
}

function MustafhemView({ profile, settings }: any) {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIstifham, setNewIstifham] = useState({ 
    title: "", 
    description: "", 
    goal: "",
    amount: "", 
    category: "", 
    categorySub: "", 
    categoryOption: "", 
    meetingTime: "", 
    attachmentUrl: "" 
  });
  const { toast } = useToast();
  const router = useRouter();

  const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "categories"), orderBy("createdAt", "desc")) : null, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const readySessionsQuery = useMemoFirebase(() => (firestore && profile.id) ? query(collection(firestore, "istifhams"), where("mustafhemId", "==", profile.id), where("status", "==", "paid"), limit(10)) : null, [firestore, profile.id]);
  const { data: paidSessions } = useCollection(readySessionsQuery);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];

  const handleCreate = async () => {
    if (!newIstifham.title || !newIstifham.description || !newIstifham.goal || !newIstifham.category || !newIstifham.amount || !newIstifham.meetingTime) {
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
      setNewIstifham({ title: "", description: "", goal: "", amount: "", category: "", categorySub: "", categoryOption: "", meetingTime: "", attachmentUrl: "" });
      toast({ title: "تم الإرسال للمراجعة" });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2">
        <div className="space-y-4 text-right">
          <h2 className="text-4xl font-black text-zinc-800">{settings?.studentDashboardTitle || "عندك سؤال؟ اطرح استفهامك الآن"}</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl">{settings?.studentDashboardBtn || "طلب استفهام جديد"}</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[700px] rounded-[3rem]" dir="rtl">
              <DialogHeader><DialogTitle className="text-right text-3xl font-black">تفاصيل الاستفهام</DialogTitle></DialogHeader>
              <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto px-4">
                <div className="space-y-2"><Label className="font-black">عنوان الاستفهام</Label><Input value={newIstifham.title} onChange={(e)=>setNewIstifham({...newIstifham, title: e.target.value})} className="h-14 rounded-2xl border-2 font-bold" /></div>
                <div className="space-y-2"><Label className="font-black">تفاصيل الاستفهام</Label><Textarea value={newIstifham.description} onChange={(e)=>setNewIstifham({...newIstifham, description: e.target.value})} className="h-40 rounded-2xl border-2 p-4" /></div>
                <div className="space-y-2"><Label className="font-black text-primary flex items-center gap-2">هدف الاستفهام <Target size={16}/></Label><Textarea value={newIstifham.goal} onChange={(e)=>setNewIstifham({...newIstifham, goal: e.target.value})} className="h-24 rounded-2xl border-2 border-primary/20 p-4 font-medium" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="font-black">القسم</Label><Select onValueChange={(v)=>setNewIstifham({...newIstifham, category: v})}><SelectTrigger className="h-14 rounded-xl border-2"><SelectValue placeholder="اختر القسم" /></SelectTrigger><SelectContent>{mainCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="font-black">الميزانية</Label><Input type="number" value={newIstifham.amount} onChange={(e)=>setNewIstifham({...newIstifham, amount: e.target.value})} className="h-14 rounded-2xl border-2" /></div>
                </div>
                <div className="space-y-2"><Label className="font-black">موعد المحاضرة</Label><Input type="datetime-local" value={newIstifham.meetingTime} onChange={(e)=>setNewIstifham({...newIstifham, meetingTime: e.target.value})} className="h-14 rounded-2xl border-2" /></div>
              </div>
              <DialogFooter className="px-4 pb-6"><Button onClick={handleCreate} className="w-full h-16 text-xl font-black rounded-2xl">تأكيد وإرسال للمراجعة</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <BookOpen size={120} className="text-primary opacity-20 hidden md:block" />
      </div>

      {paidSessions && paidSessions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black border-r-8 border-green-500 pr-6 flex items-center gap-3">
            <Video className="text-green-600" /> محاضرات جاهزة للبدء
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidSessions.map(ist => (
              <Card key={ist.id} className="rounded-[2.5rem] border-2 border-green-500/20 bg-white p-6 shadow-lg hover:border-green-500 transition-all">
                <Badge className="bg-green-100 text-green-600 mb-4">مدفوعة - جاهزة للبدء</Badge>
                <h4 className="text-xl font-black line-clamp-1">{ist.title}</h4>
                <div className="pt-4 border-t border-dashed mt-4">
                  <Button onClick={() => router.push(`/meeting/${ist.id}`)} className="w-full h-12 rounded-xl font-black bg-green-600">دخول المحاضرة الآن</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MufhemView({ profile, settings }: any) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({ balance: 0, completed: 0, rating: 5.0 });

  const istifhamsQuery = useMemoFirebase(() => (firestore) ? query(collection(firestore, "istifhams"), where("status", "==", "active")) : null, [firestore]);
  const { data: rawIstifhams, isLoading } = useCollection(istifhamsQuery);

  const paidSessionsQuery = useMemoFirebase(() => (firestore && profile.id) ? query(
    collection(firestore, "istifhams"),
    where("mufhemId", "==", profile.id),
    where("status", "==", "paid"),
    limit(10)
  ) : null, [firestore, profile.id]);

  const { data: paidSessions } = useCollection(paidSessionsQuery);

  const istifhams = rawIstifhams?.filter(ist => !ist.mustafhemGender || ist.mustafhemGender === profile.gender);

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

  const handleAccept = async (ist: any) => {
    if (!firestore) return;
    try {
      updateDocumentNonBlocking(doc(firestore, "istifhams", ist.id), { 
        status: "accepted", 
        mufhemId: profile.id, 
        mufhemName: profile.fullName 
      });
      toast({ title: "تم قبول الطلب", description: "بانتظار قيام المستفهم بالدفع لبدء الجلسة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
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

      {paidSessions && paidSessions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black border-r-8 border-green-500 pr-6 flex items-center gap-3">
            <Video className="text-green-600" /> محاضرات جاهزة للبدء (مدفوعة)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidSessions.map(ist => (
              <Card key={ist.id} className="rounded-[2.5rem] border-2 border-green-500/20 bg-white p-6 shadow-lg hover:border-green-500 transition-all">
                <Badge className="bg-green-100 text-green-600 mb-4">المستفهم دفع - ابدأ الآن</Badge>
                <h4 className="text-xl font-black line-clamp-1">{ist.title}</h4>
                <div className="pt-4 border-t border-dashed mt-4">
                  <Button onClick={() => router.push(`/meeting/${ist.id}`)} className="w-full h-12 rounded-xl font-black bg-green-600">دخول المحاضرة الآن</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-black">الاستفهامات المتاحة</h3>
          <Badge className="bg-blue-100 text-blue-600 border-none flex items-center gap-2"><BellRing size={14}/> طلبات جديدة</Badge>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-20 text-center animate-pulse font-bold">جاري البحث...</div>
          ) : (istifhams && istifhams.length > 0) ? (
            istifhams.map(ist => (
              <div key={ist.id} className="p-6 hover:bg-zinc-50 transition-all cursor-pointer" onClick={() => router.push(`/requests/${ist.id}`)}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-bold text-primary">{ist.title}</h4>
                    <Badge variant="secondary">{ist.category}</Badge>
                  </div>
                  <p className="text-zinc-600 text-sm line-clamp-2">{ist.description}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-2xl font-black text-primary">{ist.amount} ج.م</span>
                    <div className="flex gap-2">
                      <Button onClick={(e) => { e.stopPropagation(); router.push(`/requests/${ist.id}`); }} variant="outline" className="rounded-xl font-bold border-primary text-primary">قدم عرض</Button>
                      <Button onClick={(e) => { e.stopPropagation(); handleAccept(ist); }} className="rounded-xl font-bold">أنا أفهمك</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center text-muted-foreground font-black text-xl opacity-30">لا توجد طلبات متاحة حالياً.</div>
          )}
        </div>
      </div>
    </div>
  );
}
