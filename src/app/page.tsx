
"use client";

import { useState, useEffect } from "react";
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
  Timer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy, addDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
            <p className="text-lg text-muted-foreground font-medium">نحن بصدد مراجعة بيانات ملفك الشخصي في منصة فهمت لضمان الجودة. ستتلقى إشعاراً فور تفعيل حسابك.</p>
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
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10" dir="rtl">
      <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-2 border-primary/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-right flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-primary/80">أهلاً بك مجدداً في فهمت</h1>
            <div className="flex items-center gap-4 justify-end md:justify-start">
              <span className="text-4xl md:text-7xl font-black text-primary tracking-tighter">{profile.fullName}</span>
              {profile.isVerified && (
                <img src={verifiedBadgeUrl} alt="Verified" className="h-10 w-10 md:h-12 md:w-12" />
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

  const landingImage = settings?.landingBg || PlaceHolderImages.find(img => img.id === 'landing-bg')?.imageUrl || "";
  const defaultLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo-official')?.imageUrl;

  return (
    <div className="relative min-h-screen bg-white font-body overflow-x-hidden flex flex-col" dir="rtl">
      <div className="relative min-h-[95vh] flex flex-col">
        <div className="absolute inset-0 z-0">
          <Image src={landingImage} alt="Background" fill priority className="object-cover brightness-[0.3]" />
        </div>
        
        <header className="relative z-50 px-4 md:px-12 py-6 flex items-center justify-between bg-black/20 backdrop-blur-md overflow-hidden">
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
            <nav className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-6">
              <LandingNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
              <LandingNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
              <LandingNavLink href="/browse" icon={Search} label="الاستفهامات" />
            </nav>
            
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <Button onClick={() => router.push('/login')} variant="ghost" className="text-white hover:bg-white/10 font-bold text-lg hidden sm:flex">دخول</Button>
              <Button onClick={() => router.push('/login?mode=signup')} className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-8 h-14 text-xl shadow-2xl flex items-center gap-2">
                <UserPlus size={20} /> تسجيل جديد
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-1 py-20">
          <div className="max-w-5xl space-y-10">
            <h1 className="text-4xl md:text-8xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
              {settings?.heroTitle || "أول منصة عربية لخدمات الشرح الفوري"}
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
                    className="h-16 md:h-20 pr-16 rounded-[2rem] border-none bg-white text-xl font-bold shadow-inner placeholder:text-zinc-400 text-right"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => router.push(`/create-request?title=${encodeURIComponent(searchTerm)}`)}
                  className="h-16 md:h-20 px-12 rounded-[2rem] bg-accent hover:bg-accent/90 text-xl font-black shadow-xl shadow-accent/20 transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="ml-2" /> استفهم الآن
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="relative z-10 bg-zinc-50 py-24 px-6 md:py-32">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 text-right">
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight">كيف يعمل <span className="text-primary">{settings?.siteTitle || "فهمت"}</span>؟</h2>
              <div className="space-y-8">
                <HowItem number="١" icon={MessageSquare} title="اطرح استفهامك" desc="حدد الجزئية التي لا تفهمها، ضع السعر الذي تراه مناسباً والوقت المناسب لك، وانشر استفهامك ليصل إلى نخبة من المُفَهِّمين الموثقين." />
                <HowItem number="٢" icon={Users} title="اختر المُفَهِّم الأنسب" desc="قارن بين عروض المُفَهِّمين، راجع معرض أعمالهم وتقييماتهم السابقة وتواصل معهم لاختيار من يمتلك أسلوب الشرح الأقرب لك." />
                <HowItem number="٣" icon={Video} title="ابدأ التعلم" desc="انضم لجلسة التفهيم المباشرة، استفسر عن كل التفاصيل، ولا تغلق الجلسة إلا بعد تحقيق هدف استفهامك تماماً." />
                <HowItem number="٤" icon={Star} title="قيم التجربة" desc="ساعدنا على التحسين بتقييم المُفَهِّم وتقييم جودة الجلسة لضمان استمرار الجودة في فهمت." />
              </div>
            </div>

            <div className="relative group">
              <div className="relative aspect-video w-full rounded-[3.5rem] overflow-hidden shadow-2xl border-[15px] border-white bg-black">
                {settings?.landingVideoId ? (
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${settings.landingVideoId}?rel=0`} frameBorder="0" allowFullScreen></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Play className="text-white opacity-20 h-24 w-24" /></div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-16 pt-10">
            <h2 className="text-4xl md:text-6xl font-black text-zinc-900 text-center">لماذا تختار <span className="text-primary">{settings?.siteTitle || "فهمت"}</span>؟</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <WhyCard icon={Zap} title="شرح فوري" desc="لا تنتظر شروحات مسجلة، تواصل مع المفهم المناسب فوراً في جلسة خاصة وآمنة واستفسر عن كل ما تريد." />
              <WhyCard icon={RefreshCw} title="مرونة كاملة" desc="بحساب واحد فقط، يمكنك التبديل في أي وقت بين كونك مُستَفهِم يبحث عن معلومة أو مُفَهِّم يشارك خبرته ويحقق دخلاً." />
              <WhyCard icon={ShieldCheck} title="أمان فائق" desc="تخضع كل الاستفهامات، وصور الملفات الشخصية، وأعمال المفهمين للمراجعة الدقيقة من إدارة فهمت قبل النشر." />
              <WhyCard icon={Trophy} title="دقة ومصداقية" desc="لا نسمح بوجود مُفَهِّم مجهول؛ توثيق الهوية شرط أساسي لكل مُفَهِّم قبل التمكن من تقديم أول عرض تفهيم رسمي في المنصة." />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LandingNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-white/80 hover:text-white font-black text-lg transition-all group shrink-0">
      <div className="bg-white/10 p-2 rounded-lg group-hover:bg-primary/20 group-hover:scale-110 transition-all">
        <Icon size={20} className="group-hover:text-primary" />
      </div>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

function HowItem({ number, icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="shrink-0 relative">
        <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">{number}</div>
      </div>
      <div className="space-y-1 text-right">
        <h4 className="text-xl font-black text-zinc-800">{title}</h4>
        <p className="text-muted-foreground font-bold text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function WhyCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-primary/10 hover:shadow-xl transition-all flex items-start gap-6 group">
      <div className="bg-primary/5 p-5 rounded-[1.5rem] text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0 shadow-inner">
        <Icon size={32} />
      </div>
      <div className="space-y-2 text-right">
        <h4 className="text-2xl font-black text-zinc-800">{title}</h4>
        <p className="text-muted-foreground font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function MustafhemView({ profile, settings, router }: any) {
  const firestore = useFirestore();
  
  // 1. الجلسات الجاهزة (مدفوعة)
  const readySessionsQuery = useMemoFirebase(() => {
    if (!firestore || !profile.id) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("mustafhemId", "==", profile.id), 
      where("status", "==", "paid"), 
      limit(5)
    );
  }, [firestore, profile.id]);

  // 2. الاستفهامات العامة (للتصفح)
  const publicRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(6)
    );
  }, [firestore]);

  const { data: readySessions } = useCollection(readySessionsQuery);
  const { data: publicRequests, isLoading: isPublicLoading } = useCollection(publicRequestsQuery);

  return (
    <div className="space-y-12">
      {/* CTA الرئيسي للطالب */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 gap-8 hover:border-primary/20 transition-all group">
        <div className="space-y-4 text-right flex-1">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-800 group-hover:text-primary transition-colors">
            {settings?.studentDashboardTitle || "عندك سؤال؟ اطرح استفهامك الآن"}
          </h2>
          <p className="text-lg text-muted-foreground font-bold">انشر طلبك وسيصلك عروض من أفضل الخبراء في تخصصك.</p>
          <Button onClick={() => router.push('/create-request')} size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95">
            <Plus className="ml-2" /> {settings?.studentDashboardBtn || "طلب استفهام جديد"}
          </Button>
        </div>
        <div className="bg-primary/5 p-8 rounded-full hidden md:block shrink-0 border-4 border-dashed border-primary/10 group-hover:rotate-12 transition-transform">
          <BookOpen size={100} className="text-primary opacity-40" />
        </div>
      </div>

      {/* قسم الجلسات الجاهزة */}
      {readySessions && readySessions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-zinc-800 border-r-8 border-green-600 pr-4 flex items-center gap-3">
            <Zap className="text-green-600 animate-pulse" /> جلسات بانتظارك
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {readySessions.map(session => (
              <Card key={session.id} className="rounded-3xl border-2 border-green-100 bg-green-50/30 p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                <div className="text-right flex-1">
                  <h4 className="font-black text-xl text-zinc-800 line-clamp-1">{session.title}</h4>
                  <p className="text-sm font-bold text-zinc-500 mt-1 flex items-center gap-2 justify-end">
                    <span>{session.mufhemName}</span> <ShieldCheck size={14} className="text-green-600" />
                  </p>
                </div>
                <Button onClick={() => router.push(`/meeting/${session.id}`)} className="bg-green-600 hover:bg-green-700 h-14 px-8 rounded-xl font-black text-lg shadow-lg">
                  دخول الآن <Play size={18} className="mr-2 fill-current" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* قسم الاستفهامات العامة المتاحة */}
      <div className="space-y-8">
        <div className="flex justify-between items-center border-r-8 border-primary pr-4">
          <h3 className="text-2xl font-black text-zinc-800">استفهامات تعليمية جارية</h3>
          <Button variant="ghost" onClick={() => router.push('/browse')} className="font-black text-primary gap-2">
            تصفح الكل <ArrowRight size={18} className="rotate-180" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isPublicLoading ? (
            <div className="col-span-full py-20 text-center animate-pulse font-black text-zinc-300">جاري جلب الاستفهامات...</div>
          ) : publicRequests && publicRequests.length > 0 ? (
            publicRequests.map((req) => (
              <Card 
                key={req.id} 
                onClick={() => router.push(`/requests/${req.id}`)}
                className="rounded-3xl border-2 hover:border-primary/20 transition-all cursor-pointer group bg-white shadow-sm overflow-hidden"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold">{req.category}</Badge>
                    <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1"><Clock size={10}/> {getTimeAgo(req.createdAt)}</span>
                  </div>
                  <h4 className="font-black text-lg text-zinc-800 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {req.title}
                  </h4>
                  <div className="pt-4 border-t border-dashed flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-600 font-black text-sm">
                      <BadgeCent size={14} /> <span>{req.amount} ج.م</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                      <User size={12} /> {req.mustafhemName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
              <Activity className="mx-auto text-zinc-300 mb-4" size={48} />
              <p className="text-xl font-black text-zinc-400">كن أول من يطرح استفهاماً اليوم!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MufhemView({ profile, settings, router }: any) {
  const firestore = useFirestore();
  
  const availableRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [firestore]);

  const { data: availableRequests, isLoading } = useCollection(availableRequestsQuery);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 gap-8 hover:border-accent/20 transition-all group">
        <div className="space-y-4 text-right flex-1">
          <h2 className="text-3xl md:text-4xl font-black text-zinc-800 leading-tight group-hover:text-accent transition-colors">
            {settings?.teacherDashboardTitle || "اعرض مهاراتك.. أضف عملاً جديداً لمعرضك"}
          </h2>
          <p className="text-muted-foreground font-bold text-lg">
            {settings?.teacherDashboardSubtitle || "كلما زادت أعمالك المميزة، زادت ثقة طلاب فهمت باختيارك لمشاريعهم."}
          </p>
          <Button 
            onClick={() => router.push('/portfolio/add')} 
            size="lg" 
            className="h-16 px-10 text-xl font-black rounded-2xl bg-accent hover:bg-accent/90 shadow-xl transition-transform hover:scale-105"
          >
            <Plus className="ml-2" /> {settings?.teacherDashboardBtn || "إضافة عمل جديد للمعرض"}
          </Button>
        </div>
        <div className="bg-accent/5 p-8 rounded-full hidden md:block shrink-0 border-4 border-dashed border-accent/10 group-hover:-rotate-12 transition-transform">
          <Briefcase size={100} className="text-accent opacity-40" />
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex justify-between items-center border-r-8 border-primary pr-4">
          <h3 className="text-2xl font-black text-zinc-800">فرص بانتظار خبير</h3>
          <Button variant="ghost" onClick={() => router.push('/browse')} className="font-black text-primary gap-2">
            تصفح الكل <ArrowRight size={18} className="rotate-180" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center animate-pulse font-black text-zinc-300">جاري جلب الفرص المتاحة...</div>
          ) : availableRequests && availableRequests.length > 0 ? (
            availableRequests.map((req) => (
              <Card 
                key={req.id} 
                onClick={() => router.push(`/requests/${req.id}`)}
                className="rounded-3xl border-2 hover:border-primary/20 transition-all cursor-pointer group bg-white shadow-sm overflow-hidden"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold">{req.category}</Badge>
                    <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1"><Clock size={10}/> {getTimeAgo(req.createdAt)}</span>
                  </div>
                  <h4 className="font-black text-lg text-zinc-800 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {req.title}
                  </h4>
                  <div className="pt-4 border-t border-dashed flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-600 font-black">
                      <BadgeCent size={16} /> <span>{req.amount} ج.م</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                      <ClipboardList size={12} /> بانتظار العروض
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
              <Activity className="mx-auto text-zinc-300 mb-4" size={48} />
              <p className="text-xl font-black text-zinc-400">لا توجد استفهامات جديدة حالياً. تأكد من تفعيل التنبيهات!</p>
            </div>
          )}
        </div>
      </div>
    </div>
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
