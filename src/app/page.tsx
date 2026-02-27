
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  ShieldAlert,
  LogOut,
  Scale,
  GraduationCap,
  Layout,
  Search,
  ArrowRight,
  MessageSquare,
  Plus,
  Video,
  BadgeCent,
  Zap,
  Clock,
  Play,
  Menu,
  User,
  UserPlus,
  Users,
  ShieldCheck,
  Star,
  Briefcase,
  History,
  ClipboardList,
  Activity,
  Trophy,
  RefreshCw,
  Timer,
  HelpCircle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy, addDoc, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const FAQS = [
  { q: "كيف أبدأ كـ 'مستفهم'؟", a: "ببساطة اضغط على 'طرح استفهام' في الصفحة الرئيسية، صف معلومتك وحدد سعرك، وسيتواصل معك المفهمون المناسبون." },
  { q: "كيف يتم توثيق حساب المفهم؟", a: "يجب عليك رفع صورة البطاقة الشخصية وصورة شخصية واضحة من ملفك الشخصي، وسيقوم فريق فهمت بمراجعتها وتوثيق حسابك بشارة زرقاء." },
  { q: "هل أموالي في أمان؟", a: "نعم، فهمت وسيط ضامن؛ لا يتم تحويل المبلغ للمفهم إلا بعد تأكيدك بأنك فهمت المعلومة المطلوبة تماماً." },
  { q: "ما هي طرق سحب الأرباح؟", a: "يمكنك سحب أرباحك عبر المحافظ الإلكترونية (فودافون كاش وغيرها)، إنستا باي (InstaPay)، أو التحويل البنكي المباشر." }
];

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
      toast({ title: "تم إرسال الطعن", description: "سيتم مراجعة طلبك من قبل إدارة فهمت." });
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
            <CardTitle className="text-4xl font-black text-zinc-900">عذراً، تم حظر حسابك في فهمت</CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-4">
              <h4 className="text-xl font-black flex items-center gap-2"><Scale className="text-red-600" /> تقديم طعن للإدارة</h4>
              <Textarea placeholder="اكتب سبب الطعن بوضوح..." className="h-40 rounded-xl" value={appealReason} onChange={(e) => setAppealReason(e.target.value)} />
              <Button onClick={handleSendAppeal} disabled={isSendingAppeal} className="w-full h-14 bg-red-600 font-bold text-white rounded-xl shadow-lg">إرسال طعن</Button>
            </div>
            <Button variant="outline" onClick={() => signOut(auth).then(() => router.push("/login"))} className="w-full h-14 font-bold rounded-xl border-2">تسجيل الخروج</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.needsProfileCompletion) {
    router.push("/profile");
    return null;
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10" dir="rtl">
      <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-2 border-primary/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-right flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-primary/80">أهلاً بك مجدداً في فهمت</h1>
            <div className="flex items-center gap-4 justify-end md:justify-start">
              <span className="text-4xl md:text-7xl font-black text-primary tracking-tighter">{profile.fullName}</span>
              {profile.isVerified && (
                <ShieldCheck className="h-10 w-10 md:h-12 md:w-12 text-blue-500 fill-blue-500/10" />
              )}
            </div>
          </div>
          <div className="flex flex-col items-center bg-muted/20 p-8 rounded-3xl shrink-0">
            <Badge className="mt-2 px-6 py-2 text-md font-black">
              {profile.isAdmin ? "مسؤول النظام" : (profile.role === "mufhem" ? "مُفهم" : "مُستفهم")}
            </Badge>
          </div>
        </div>
      </div>
      {profile.role === "mustafhem" ? (
        <MustafhemView profile={profile} settings={settings} router={router} />
      ) : (
        <MufhemView profile={profile} settings={settings} router={router} />
      )}
    </div>
  );
}

function LandingPage({ router, settings }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const defaultLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo-official')?.imageUrl;
  const landingBg = settings?.landingBg || PlaceHolderImages.find(img => img.id === 'landing-bg')?.imageUrl;

  return (
    <div className="relative min-h-screen bg-white font-body overflow-x-hidden flex flex-col" dir="rtl">
      <div className="relative min-h-screen flex flex-col">
        {/* Header Overlay */}
        <header className="absolute top-0 inset-x-0 z-50 px-4 md:px-12 py-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b shadow-sm">
          <div className="flex items-center gap-4 shrink-0">
            <SidebarTrigger className="h-10 w-10 md:h-12 md:w-12 text-white bg-accent hover:bg-accent/90 rounded-xl shrink-0 border-none flex items-center justify-center shadow-lg">
              <Menu className="h-6 w-6 md:h-7 md:size-7" />
            </SidebarTrigger>
            <Link href="/" className="flex items-center group shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center overflow-hidden bg-transparent">
                <img src={defaultLogo} className="w-full h-full object-contain" alt="Logo" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-8 flex-1 justify-end">
            <nav className="hidden lg:flex items-center gap-6 border-l border-zinc-100 pl-6">
              <LandingNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
              <LandingNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
              <LandingNavLink href="/browse" icon={Search} label="الاستفهامات" />
            </nav>
            
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <Button onClick={() => router.push('/login')} variant="ghost" className="text-zinc-600 hover:bg-zinc-100 font-bold text-lg hidden sm:flex">دخول</Button>
              <Button onClick={() => router.push('/login?mode=signup')} className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-8 h-14 text-xl shadow-xl flex items-center gap-2">
                <UserPlus size={20} /> تسجيل جديد
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section with Image Background */}
        <main className="relative flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={landingBg} 
              className="w-full h-full object-cover brightness-[0.35]" 
              alt="Landing Background"
              data-ai-hint="learning background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
          </div>

          <div className="relative z-10 w-full max-w-6xl px-4 pt-32 pb-20 space-y-12">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-9xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
                {settings?.heroTitle || "أول منصة عربية لخدمات الشرح الفوري"}
              </h1>
              <p className="text-xl md:text-4xl text-zinc-200 font-bold max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                {settings?.heroSubtitle || "اربط عقلك بأفضل الخبراء واحصل على شرح مخصص لك في جلسات تفاعلية مباشرة."}
              </p>
            </div>

            <div className="relative max-w-4xl w-full mx-auto mt-12 group animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/95 backdrop-blur-xl rounded-[3rem] border-4 border-primary/20 shadow-[0_30px_100px_rgba(0,0,0,0.3)] transition-all group-hover:border-primary/40">
                <div className="relative flex-1">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary h-8 w-8" />
                  <Input 
                    placeholder="ابحث عن أي موضوع يدور في ذهنك..." 
                    className="h-16 md:h-24 pr-16 rounded-[2.5rem] border-none bg-zinc-50 text-2xl font-bold shadow-inner placeholder:text-zinc-400 text-right"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => router.push(`/create-request?title=${encodeURIComponent(searchTerm)}`)}
                  className="h-16 md:h-24 px-12 rounded-[2.5rem] bg-accent hover:bg-accent/90 text-2xl font-black shadow-xl shadow-accent/20 transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="ml-2" /> استفهم الآن
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-zinc-900">الأسئلة الشائعة</h2>
            <p className="text-xl text-zinc-500 font-bold">كل ما تحتاج معرفته عن منصة فهمت في مكان واحد.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FAQS.map((faq, i) => (
              <Card key={i} className="rounded-[2.5rem] border-2 bg-zinc-50 p-10 space-y-4 hover:border-primary/20 transition-all shadow-sm">
                <h4 className="text-2xl font-black text-zinc-800 flex items-center gap-3">
                  <HelpCircle className="text-primary" /> {faq.q}
                </h4>
                <p className="text-lg text-zinc-600 font-bold leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function LandingNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-zinc-600 hover:text-primary font-black text-lg transition-all group shrink-0">
      <div className="bg-zinc-100 p-2 rounded-lg group-hover:bg-primary/10 transition-all">
        <Icon size={20} className="group-hover:text-primary" />
      </div>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

function MustafhemView({ profile, settings, router }: any) {
  const firestore = useFirestore();
  
  const readySessionsQuery = useMemoFirebase(() => {
    if (!firestore || !profile.id) return null;
    return query(collection(firestore, "istifhams"), where("mustafhemId", "==", profile.id), where("status", "==", "paid"), limit(5));
  }, [firestore, profile.id]);

  const publicRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), where("status", "==", "active"), limit(6));
  }, [firestore]);

  const { data: readySessions } = useCollection(readySessionsQuery);
  const { data: rawPublicRequests, isLoading: isPublicLoading } = useCollection(publicRequestsQuery);

  const publicRequests = useMemo(() => rawPublicRequests ? [...rawPublicRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [], [rawPublicRequests]);

  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);
  const { data: allUsers } = useCollection(allUsersQuery);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 gap-8 hover:border-primary/20 transition-all group">
        <div className="space-y-4 text-right flex-1">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-800">عندك سؤال؟ اطرح استفهامك الآن</h2>
          <p className="text-lg text-muted-foreground font-bold">صف معلومتك وحدد سعرك لتصل إلى أفضل المفهمين في فهمت.</p>
          <Button onClick={() => router.push('/create-request')} size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-lg">
            <Plus className="ml-2" /> طلب استفهام جديد
          </Button>
        </div>
        <div className="bg-primary/5 p-8 rounded-full hidden md:block shrink-0 border-4 border-dashed border-primary/10 group-hover:rotate-12 transition-transform">
          <BookOpen size={100} className="text-primary opacity-40" />
        </div>
      </div>

      {readySessions && readySessions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-zinc-800 border-r-8 border-green-600 pr-4 flex items-center gap-3">
            <Zap className="text-green-600 animate-pulse" /> جلسات بانتظارك
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {readySessions.map(session => (
              <Card key={session.id} className="rounded-3xl border-2 border-green-100 bg-green-50/30 p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                <div className="text-right flex-1">
                  <h4 className="font-black text-xl text-zinc-800">{session.title}</h4>
                  <p className="text-sm font-bold text-zinc-500 mt-1">المفهم: {session.mufhemName}</p>
                </div>
                <Button onClick={() => router.push(`/meeting/${session.id}`)} className="bg-green-600 hover:bg-green-700 h-14 px-8 rounded-xl font-black">
                  دخول الآن <Play size={18} className="mr-2 fill-current" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <h3 className="text-2xl font-black text-zinc-800 border-r-8 border-primary pr-4">استفهامات تعليمية جارية</h3>
        <div className="grid grid-cols-1 gap-6">
          {isPublicLoading ? (
            <div className="col-span-full py-20 text-center animate-pulse font-black text-zinc-300">جاري جلب الاستفهامات...</div>
          ) : publicRequests.map((req) => (
            <IstifhamCard key={req.id} req={req} allUsers={allUsers} router={router} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MufhemView({ profile, settings, router }: any) {
  const firestore = useFirestore();
  
  const availableRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), where("status", "==", "active"), limit(10));
  }, [firestore]);

  const { data: rawAvailableRequests, isLoading } = useCollection(availableRequestsQuery);
  const availableRequests = useMemo(() => rawAvailableRequests ? [...rawAvailableRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [], [rawAvailableRequests]);

  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);
  const { data: allUsers } = useCollection(allUsersQuery);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 gap-8 hover:border-accent/20 transition-all group">
        <div className="space-y-4 text-right flex-1">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-800">أضف عملاً جديداً لمعرضك</h2>
          <p className="text-lg text-muted-foreground font-bold">اعرض مهاراتك لتكسب ثقة المستفهمين في فهمت.</p>
          <Button onClick={() => router.push('/portfolio/add')} size="lg" className="h-16 px-10 text-xl font-black rounded-2xl bg-accent hover:bg-accent/90 shadow-xl transition-transform hover:scale-105">
            <Plus className="ml-2" /> إضافة عمل جديد
          </Button>
        </div>
        <div className="bg-accent/5 p-8 rounded-full hidden md:block shrink-0 border-4 border-dashed border-accent/10 group-hover:-rotate-12 transition-transform">
          <Briefcase size={100} className="text-accent opacity-40" />
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-black text-zinc-800 border-r-8 border-primary pr-4">فرص بانتظار مُفهم</h3>
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center animate-pulse font-black text-zinc-300">جاري جلب الفرص المتاحة...</div>
          ) : availableRequests.map((req) => (
            <IstifhamCard key={req.id} req={req} allUsers={allUsers} router={router} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IstifhamCard({ req, allUsers, router }: any) {
  const requester = allUsers?.find((u: any) => u.id === req.mustafhemId);
  const defaultMaleAvatar = "https://picsum.photos/seed/male/200/200";
  const defaultFemaleAvatar = "https://picsum.photos/seed/female/200/200";
  const avatar = requester?.profilePictureUrl || (requester?.gender === 'female' ? defaultFemaleAvatar : defaultMaleAvatar);

  return (
    <Card 
      onClick={() => router.push(`/requests/${req.id}`)} 
      className="rounded-[2.5rem] border-2 hover:border-primary/20 transition-all cursor-pointer group bg-white shadow-md overflow-hidden flex flex-col md:flex-row"
    >
      {/* الجهة اليمنى: بيانات المستفهم */}
      <div className="md:w-64 bg-zinc-50/50 p-6 flex flex-col items-center justify-center text-center border-l shrink-0">
        <Avatar className="h-20 w-20 border-4 border-white shadow-lg mb-3">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-black">{req.mustafhemName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 text-center">
          <p className="font-black text-md leading-tight text-zinc-900">{req.mustafhemName}</p>
          <p className="text-[10px] text-zinc-400 font-bold">{requester?.specialization || "مستفهم طموح"}</p>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 flex flex-col space-y-4">
        {/* الشريط العلوي: معلومات الجلسة */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-zinc-400 border-b border-dashed pb-4">
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg flex items-center gap-1"><BadgeCent size={12} /> {req.amount} ج.م</span>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg flex items-center gap-1"><Calendar size={12} /> {new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
          <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-lg flex items-center gap-1"><Layers size={12} /> {req.category}</span>
          <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-lg flex items-center gap-1"><ClipboardList size={12} /> {req.offersCount || 0} عروض</span>
          <span className="flex items-center gap-1"><Clock size={12} /> منذ {getTimeAgo(req.createdAt)}</span>
          <Badge className="mr-auto bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-lg">{req.status === 'active' ? 'مفتوح' : req.status === 'completed' ? 'مكتمل' : 'ملغي'}</Badge>
        </div>

        {/* المحتوى الأساسي: العنوان والوصف */}
        <div className="space-y-2 text-right">
          <h3 className="text-xl md:text-2xl font-black text-zinc-800 group-hover:text-primary transition-colors leading-tight">{req.title}</h3>
          <p className="text-zinc-500 font-medium line-clamp-2 text-sm leading-relaxed">{req.description}</p>
        </div>
      </div>
    </Card>
  );
}

function getTimeAgo(dateStr: string) {
  if (!dateStr) return "لحظات";
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 60) return `${minutes}د`;
  if (hours < 24) return `${hours}س`;
  return `${days}ي`;
}
