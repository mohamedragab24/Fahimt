
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UICardDescription } from "@/components/ui/card";
import { 
  PlusCircle, 
  BookOpen, 
  BadgeCent, 
  Clock, 
  Send, 
  Sparkles, 
  TrendingUp, 
  CalendarDays, 
  ShieldCheck, 
  Upload, 
  FileText, 
  X,
  GraduationCap,
  Users2,
  Video,
  Wallet,
  Star,
  Activity,
  Bot,
  MessageSquare,
  Wand2,
  Search,
  Headset,
  Layers,
  Filter,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription as UIDialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { refineRequest } from "@/ai/flows/refine-request-flow";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

function LandingFeature({ icon: Icon, title, desc }: any) {
  return (
    <Card className="rounded-[2.5rem] p-10 border-2 hover:border-primary transition-all text-center space-y-6 bg-white shadow-xl group cursor-default">
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary transition-transform group-hover:scale-110">
        <Icon size={40} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-zinc-900">{title}</h3>
        <p className="text-zinc-500 text-lg leading-relaxed font-bold">{desc}</p>
      </div>
    </Card>
  );
}

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

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

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-black animate-pulse text-primary text-2xl">جاري التحميل...</div>;

  if (!user || !profile) {
    return <LandingPage router={router} settings={settings} />;
  }

  return (
    <div className="p-4 md:p-10 max-7xl mx-auto space-y-10" dir="rtl">
      <div className="relative overflow-hidden bg-white p-6 md:p-12 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.05)] border-2 border-primary/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-right">
          <div className="space-y-6">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-headline text-primary/80">
                {profile.role === "mufhem" ? "أهلاً بك يا مُفهم!" : "أهلاً بك يا مُستفهم!"}
              </h1>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="block text-primary text-5xl md:text-7xl font-black tracking-tight">{profile.fullName || "مستخدم فهمني"}</span>
              {profile.role === 'mufhem' && (
                <div className="bg-primary p-2 rounded-full shadow-lg shadow-primary/20 animate-pulse">
                  <ShieldCheck className="text-white h-8 w-8 md:h-10 md:w-10" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-xl md:text-2xl font-bold leading-relaxed">
              {profile.role === "mufhem" 
                ? "خبرتك هي رأسمالك؛ شاركها اليوم وحقق أرباحاً فورية." 
                : "كل سؤال له جواب، وكل مسألة لها حل مع أفضل المفهمين."}
            </p>
          </div>
          <div className="flex flex-col items-center bg-white p-8 md:p-10 rounded-[2.5rem] border-2 border-primary/10 shadow-xl shadow-primary/5">
            <TrendingUp className="text-accent h-10 w-10 md:h-12 md:w-12 mb-4" />
            <span className="text-sm text-muted-foreground font-black uppercase tracking-wider">الرتبة الحالية</span>
            <Badge className="mt-3 px-8 py-3 text-lg font-black bg-primary shadow-lg shadow-primary/20 flex items-center gap-2 rounded-2xl hover:bg-primary">
              {profile.role === "mufhem" ? (
                <><ShieldCheck className="h-5 w-5" /> مُفهم معتمد</>
              ) : "مُستفهم طموح"}
            </Badge>
          </div>
        </div>
      </div>

      {profile.role === "mustafhem" ? <StudentView profile={profile} settings={settings} /> : <TeacherView profile={profile} settings={settings} />}
    </div>
  );
}

function LandingPage({ router, settings }: { router: any, settings: any }) {
  const [searchValue, setSearchValue] = useState("");
  const landingImage = settings?.landingBg || PlaceHolderImages.find(img => img.id === 'landing-bg')?.imageUrl || "";

  return (
    <div className="min-h-screen bg-white font-body overflow-x-hidden" dir="rtl">
      <header className="absolute top-0 left-0 w-full z-50 px-4 md:px-16 py-8 flex items-center justify-between bg-transparent">
        <div className="flex items-center gap-4 order-1">
          <Button 
            onClick={() => router.push('/login')} 
            className="bg-[#29B6F6] hover:bg-[#29B6F6]/90 text-white font-black rounded-full px-10 py-7 text-xl shadow-xl transition-all hover:scale-105"
          >
            حساب جديد
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/login')} 
            className="bg-white/10 hover:bg-white/20 text-white font-black rounded-full px-10 py-7 text-xl backdrop-blur-md transition-all"
          >
            دخول
          </Button>
        </div>

        <nav className="hidden lg:flex items-center gap-12 text-white font-black text-xl order-2">
          <Link href="/requests" className="hover:text-[#29B6F6] transition-all flex items-center gap-3 group">
            تصفح الاستفهامات <MessageSquare className="h-6 w-6 group-hover:scale-110" />
          </Link>
          <Link href="/teachers" className="hover:text-[#29B6F6] transition-all flex items-center gap-3 group">
            أعمال المفهمين <Headset className="h-6 w-6 group-hover:scale-110" />
          </Link>
          <Link href="/teachers" className="hover:text-[#29B6F6] transition-all flex items-center gap-3 group">
            المفهمين <Users2 className="h-6 w-6 group-hover:scale-110" />
          </Link>
        </nav>

        <div className="flex items-center gap-3 order-3">
          <div className="flex flex-col items-end">
            <span className="text-5xl font-black font-headline text-[#29B6F6] leading-none tracking-tighter drop-shadow-sm">فهمني</span>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center bg-[#29B6F6] rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="F" className="h-10 w-auto" />
            ) : (
              <span className="text-white font-black text-3xl">ف</span>
            )}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7043] rounded-full border-2 border-white shadow-md"></div>
          </div>
        </div>
      </header>

      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={landingImage}
            alt="Fahmani Background"
            fill
            priority
            className="object-cover object-center brightness-[0.4]"
            data-ai-hint="book lightbulb"
          />
        </div>

        <div className="relative z-10 space-y-16 max-w-7xl px-4">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-9xl font-black font-headline text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              اول منصة عربية لخدمات الشرح الفوري
            </h1>
            <p className="text-3xl md:text-5xl text-zinc-100 font-bold drop-shadow-lg opacity-90 tracking-wide">
              شروحات مباشرة تُقدَّم خصيصاً من أجلك
            </p>
          </div>

          <div className="mt-20 w-full max-w-6xl mx-auto flex items-center bg-white rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-4 group transition-all hover:shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
            <Button 
              size="lg" 
              onClick={() => router.push('/login')}
              className="bg-[#29B6F6] hover:bg-[#29B6F6]/90 text-white font-black text-4xl h-24 px-20 rounded-xl transition-all active:scale-95 shadow-lg"
            >
              استفهم الآن
            </Button>
            <div className="flex-1">
              <Input 
                placeholder="أدخل عنوان الموضوع الذي تريد فهمه" 
                className="w-full h-24 border-none shadow-none text-3xl font-black text-zinc-800 px-12 text-right focus-visible:ring-0 placeholder:text-zinc-400 bg-transparent"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-zinc-50 relative">
        <div className="container px-4 grid grid-cols-1 md:grid-cols-3 gap-16">
          <LandingFeature 
            icon={Video} 
            title="بث مباشر فوري" 
            desc="تواصل صوت وصورة مع المدرس في غرف مشفرة وخاصة لضمان أقصى استفادة تعليمية."
          />
          <LandingFeature 
            icon={ShieldCheck} 
            title="مفهمين موثقين" 
            desc="نحن نختار النخبة؛ كل مدرس يمر بعملية تدقيق صارمة ومراجعة شاملة قبل الانضمام لنا."
          />
          <LandingFeature 
            icon={BadgeCent} 
            title="نظام مالي آمن" 
            desc="أنت المتحكم في الميزانية؛ ادفع فقط مقابل ما تفهمه وبكل سهولة عبر محفظتك الإلكترونية."
          />
        </div>
      </section>
    </div>
  );
}

function StudentView({ profile, settings }: { profile: any, settings: any }) {
  const firestore = useFirestore();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newRequest, setNewRequest] = useState({ 
    title: "", 
    amount: "", 
    category: "", 
    categorySub: "", 
    categoryOption: "", 
    meetingTime: "", 
    attachmentUrl: "" 
  });

  const [fileName, setFileName] = useState("");
  const [isAiRefining, setIsAiRefining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "requests");
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: allCategories } = useCollection(categoriesQuery);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const selectedMainId = allCategories?.find(m => m.name === newRequest.category)?.id;
  const subCategories = allCategories?.filter(c => c.type === 'sub' && c.parentId === selectedMainId) || [];
  const selectedSubId = allCategories?.find(s => s.name === newRequest.categorySub)?.id;
  const optionCategories = allCategories?.filter(c => c.type === 'option' && c.parentId === selectedSubId) || [];

  const myRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef || !profile?.id) return null;
    return query(requestsRef, where("studentId", "==", profile.id), limit(20));
  }, [requestsRef, profile?.id]);

  const { data: rawRequests } = useCollection(myRequestsQuery);
  
  const myRequests = rawRequests 
    ? [...rawRequests].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
    : [];

  const handleAiRefine = async () => {
    if (!newRequest.title) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى كتابة فكرة الموضوع أولاً." });
      return;
    }
    setIsAiRefining(true);
    try {
      const result = await refineRequest({ text: newRequest.title });
      setNewRequest({ ...newRequest, title: result.refinedTitle });
      toast({ title: "تم تحسين الطلب", description: "لقد قام الذكاء الاصطناعي بصياغة طلبك بشكل أفضل." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل استخدام الذكاء الاصطناعي." });
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "حجم كبير", description: "أقصى حجم للملف هو 2 ميجابايت." });
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRequest(prev => ({ ...prev, attachmentUrl: reader.result as string }));
        toast({ title: "تم الرفع", description: "سيقوم المعلمون بمراجعة المرفق فوراً." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRequest = () => {
    if (!requestsRef || !newRequest.title || !newRequest.amount || !newRequest.meetingTime || !newRequest.category) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال جميع بيانات الطلب الأساسية." });
      return;
    }

    addDocumentNonBlocking(requestsRef, {
      title: newRequest.title,
      amount: Number(newRequest.amount),
      category: newRequest.category,
      categorySub: newRequest.categorySub,
      categoryOption: newRequest.categoryOption,
      status: "pending",
      studentId: profile.id,
      studentName: profile.fullName || "مستفهم",
      studentEmail: profile.email || "",
      studentPhone: profile.phoneNumber || "",
      createdAt: new Date().toISOString(),
      meetingTime: new Date(newRequest.meetingTime).toISOString(),
      attachmentUrl: newRequest.attachmentUrl || null
    });

    setIsDialogOpen(false);
    setNewRequest({ title: "", amount: "", category: "", categorySub: "", categoryOption: "", meetingTime: "", attachmentUrl: "" });
    setFileName("");
    toast({
      title: "تم إرسال الطلب بنجاح",
      description: "سيتم إخطارك فور قبول أحد المفهمين لطلبك.",
    });
  };

  const heroImage = settings?.studentHero || "https://picsum.photos/seed/learn/1000/1000";

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col items-center justify-center p-10 md:p-16 bg-gradient-to-br from-primary via-primary to-accent rounded-[3.5rem] text-white shadow-2xl text-center space-y-8 relative overflow-hidden group">
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-10 bg-cover transition-transform group-hover:scale-110 duration-1000"
            style={{ backgroundImage: `url('${heroImage}')` }}
          ></div>
          <h2 className="text-4xl md:text-5xl font-black font-headline max-w-4xl leading-tight relative z-10 drop-shadow-xl">
            إيه اللي واقف معاك؟ <br/> اسأل وهتلاقي اللي يفهِّمك بجد
          </h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-white text-primary hover:bg-zinc-50 px-12 py-8 text-2xl rounded-3xl shadow-2xl transition-all hover:scale-105 font-black relative z-10">
                <PlusCircle className="ml-4 h-8 w-8" />
                اطلب استفهام الآن
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] rounded-[3rem] max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-3xl font-black text-primary">ماذا تريد أن تتعلم اليوم؟</DialogTitle>
                <UIDialogDescription className="text-right text-xl font-bold text-muted-foreground">أكمل البيانات ليقوم النظام بربطك بالمفهم المناسب.</UIDialogDescription>
              </DialogHeader>
              <div className="grid gap-8 py-8">
                <div className="space-y-3 relative">
                  <Label htmlFor="title" className="text-xl font-black pr-2">عنوان الطلب</Label>
                  <div className="relative">
                    <Input 
                      id="title" 
                      placeholder="مثلاً: شرح درس التفاضل للصف الثالث الثانوي" 
                      value={newRequest.title} 
                      onChange={(e) => setNewRequest({...newRequest, title: e.target.value})} 
                      className="h-16 rounded-2xl pr-6 pl-14 text-lg font-bold border-2 focus:border-primary" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleAiRefine}
                      disabled={isAiRefining}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-primary hover:bg-primary/10 rounded-xl h-12 w-12"
                    >
                      <Wand2 className={`h-6 w-6 ${isAiRefining ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-black pr-2 text-primary flex items-center gap-2">
                      <Layers className="h-5 w-5" /> القسم
                    </Label>
                    <Select value={newRequest.category} onValueChange={(v) => setNewRequest({...newRequest, category: v, categorySub: "", categoryOption: ""})}>
                      <SelectTrigger className="h-16 rounded-2xl border-2 font-bold text-lg">
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {mainCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name} className="font-bold">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newRequest.category && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-lg font-black pr-2 text-accent flex items-center gap-2">
                        <Filter className="h-5 w-5" /> التخصص
                      </Label>
                      <Select value={newRequest.categorySub} onValueChange={(v) => setNewRequest({...newRequest, categorySub: v, categoryOption: ""})}>
                        <SelectTrigger className="h-16 rounded-2xl border-2 font-bold text-lg">
                          <SelectValue placeholder="اختر التخصص" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {subCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name} className="font-bold">{cat.name}</SelectItem>
                          ))}
                          {subCategories.length === 0 && <SelectItem value="none" disabled>لا توجد تخصصات متاحة لهذا القسم</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newRequest.categorySub && optionCategories.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-lg font-black pr-2 text-purple-500 flex items-center gap-2">
                        <Settings2 className="h-5 w-5" /> خيارات إضافية
                      </Label>
                      <Select value={newRequest.categoryOption} onValueChange={(v) => setNewRequest({...newRequest, categoryOption: v})}>
                        <SelectTrigger className="h-16 rounded-2xl border-2 font-bold text-lg">
                          <SelectValue placeholder="حدد تخصصاً أدق" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {optionCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name} className="font-bold">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="meetingTime" className="text-xl font-black pr-2">توقيت المحاضرة</Label>
                    <Input id="meetingTime" type="datetime-local" value={newRequest.meetingTime} onChange={(e) => setNewRequest({...newRequest, meetingTime: e.target.value})} className="h-16 rounded-2xl border-2 focus:border-primary text-lg font-bold px-6" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-xl font-black pr-2 text-accent">الميزانية (ج.م)</Label>
                    <Input id="amount" type="number" placeholder="100" value={newRequest.amount} onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})} className="h-16 rounded-2xl border-2 focus:border-accent text-lg font-bold px-6" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-xl font-black flex items-center gap-2 pr-2">
                    <Upload size={20} className="text-primary" /> إرفاق ملفات أو صور
                  </Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed rounded-[2rem] p-10 text-center cursor-pointer hover:bg-primary/5 transition-all group border-primary/10"
                  >
                    {fileName ? (
                      <div className="flex items-center justify-center gap-4 font-black text-2xl text-primary animate-in zoom-in">
                        <FileText size={32} /> {fileName}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFileName(""); setNewRequest({...newRequest, attachmentUrl: ""}); }} className="rounded-full hover:bg-red-50 text-red-500"><X size={20} /></Button>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-4 group-hover:scale-105 transition-transform">
                        <div className="bg-primary/10 p-4 rounded-3xl text-primary">
                          <Bot className="h-12 w-12" />
                        </div>
                        <span className="text-xl font-black">اضغط هنا لرفع صورة المسألة للتحليل</span>
                        <span className="text-sm font-bold opacity-50">سيقوم المساعد الذكي بتصنيف طلبك تلقائياً</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                  </div>
                </div>
              </div>
              <DialogFooter className="sticky bottom-0 bg-white pt-4">
                <Button onClick={handleCreateRequest} className="w-full py-10 text-3xl font-black rounded-3xl shadow-2xl bg-primary hover:bg-primary/90">
                  <span className="ml-4">إرسال الطلب الآن</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-[3.5rem] border-4 border-dashed border-primary/10 bg-white flex flex-col items-center justify-center p-10 text-center space-y-8 shadow-sm hover:shadow-xl transition-all group">
          <div className="bg-primary/10 p-6 rounded-[2.5rem] transition-transform group-hover:scale-110">
            <Users2 className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-zinc-900">اكتشف نخبة "المفهمين"</h3>
            <p className="text-muted-foreground text-xl font-bold leading-relaxed max-w-xs">تصفح ملفات المدرسين الموثقين واطلع على خبراتهم قبل البدء.</p>
          </div>
          <Button onClick={() => router.push('/teachers')} className="h-16 px-12 rounded-[1.5rem] font-black text-xl bg-zinc-900 hover:bg-black text-white shadow-xl shadow-zinc-200">
            تصفح القائمة الكاملة
          </Button>
        </Card>
      </div>

      <div className="space-y-10 pt-6">
        <h3 className="text-3xl md:text-4xl font-black font-headline border-r-[12px] border-primary pr-8 text-zinc-900">طلباتك الأخيرة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rawRequests?.map((req: any) => (
            <Card key={req.id} className="shadow-xl border-2 border-primary/5 hover:border-primary/40 hover:shadow-2xl transition-all rounded-[3rem] overflow-hidden bg-white group cursor-pointer" onClick={() => router.push('/requests')}>
              <CardContent className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="px-6 py-2 text-md font-black bg-primary/10 text-primary border-none rounded-2xl">{req.category}</Badge>
                  <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">{req.amount} <span className="text-sm font-bold opacity-60">ج.م</span></span>
                </div>
                <h4 className="font-black text-3xl leading-tight h-20 line-clamp-2 group-hover:text-primary transition-colors text-zinc-800">{req.title}</h4>
                <div className="flex items-center gap-3 text-primary font-black bg-primary/5 p-4 rounded-2xl border-2 border-primary/5">
                  <CalendarDays className="h-6 w-6" />
                  <span className="text-lg">{new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between items-center pt-8 border-t-2 border-dashed">
                  <div className="flex items-center text-lg text-muted-foreground font-black">
                    <Clock className="h-6 w-6 ml-3 text-accent" />
                    {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                  <Badge className={`px-6 py-2 text-md font-black rounded-2xl ${
                    req.status === 'pending' ? 'bg-orange-50 text-orange-600' : 
                    req.status === 'accepted' ? 'bg-primary/10 text-primary' : 
                    req.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'accepted' ? 'تم القبول' : req.status === 'completed' ? 'مكتمل' : 'ملغي'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!rawRequests || rawRequests.length === 0) && (
            <div className="col-span-full py-32 text-center text-muted-foreground border-4 border-dashed rounded-[4rem] text-2xl md:text-3xl font-black bg-primary/5 opacity-40">
              لا توجد طلبات سابقة.. ابدأ بطلبك الأول الآن!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeacherView({ profile, settings }: { profile: any, settings: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [filterMain, setFilterMain] = useState("all");
  const [filterSub, setFilterSub] = useState("all");
  const [filterOption, setFilterOption] = useState("all");
  
  const [showReviews, setShowReviews] = useState(false);

  const transactionsRef = useMemoFirebase(() => {
    if (!firestore || !profile?.id) return null;
    return collection(firestore, "users", profile.id, "transactions");
  }, [firestore, profile?.id]);

  const { data: transactions } = useCollection(transactionsRef);

  const balance = transactions?.reduce((acc: number, tx: any) => {
    if (tx.status === 'rejected') return acc;
    if (tx.type === 'deposit' || tx.type === 'earning') return acc + tx.amount;
    return acc - tx.amount;
  }, 0) || 0;

  const requestsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "requests");
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: allCategories } = useCollection(categoriesQuery);

  const availableRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef) return null;
    return query(
      requestsRef, 
      where("status", "==", "pending"),
      limit(50)
    );
  }, [requestsRef]);

  const myActiveRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef || !profile?.id) return null;
    return query(
      requestsRef,
      where("teacherId", "==", profile.id),
      where("status", "==", "accepted"),
      limit(5)
    );
  }, [requestsRef, profile?.id]);

  const myCompletedRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef || !profile?.id) return null;
    return query(
      requestsRef,
      where("teacherId", "==", profile.id),
      where("status", "==", "completed")
    );
  }, [requestsRef, profile?.id]);

  const { data: availableRequests, isLoading } = useCollection(availableRequestsQuery);
  const { data: activeRequests } = useCollection(myActiveRequestsQuery);
  const { data: completedRequests } = useCollection(myCompletedRequestsQuery);

  const filteredAvailable = availableRequests?.filter(r => {
    const activeFilters = [];
    if (filterMain !== "all") activeFilters.push(filterMain);
    if (filterSub !== "all") activeFilters.push(filterSub);
    if (filterOption !== "all") activeFilters.push(filterOption);

    if (activeFilters.length === 0) return true;
    
    return activeFilters.every(f => 
      r.category === f || r.categorySub === f || r.categoryOption === f
    );
  });

  const avgRating = completedRequests?.length 
    ? (completedRequests.reduce((acc, r) => acc + (r.rating || 0), 0) / completedRequests.length).toFixed(1)
    : "5.0";

  const handleAcceptRequest = (req: any) => {
    if (!firestore || !profile) return;
    const reqRef = doc(firestore, "requests", req.id);
    
    updateDocumentNonBlocking(reqRef, {
      status: "accepted",
      teacherId: profile.id,
      teacherName: profile.fullName || "مفهم",
      teacherPhone: profile.phoneNumber || "",
      teacherSpecialization: profile.specialization || ""
    });

    toast({
      title: "تم قبول الطلب بنجاح!",
      description: `لقد قبلت طلب ${req.studentName}. تم إرسال إشعار له برابط المحاضرة.`,
    });
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-primary text-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary/20 flex items-center gap-8 group transition-all hover:scale-[1.02]">
          <div className="bg-white/20 p-6 rounded-3xl transition-transform group-hover:rotate-12">
            <Wallet size={48} />
          </div>
          <div>
            <p className="text-lg font-black opacity-80 uppercase tracking-tighter">الرصيد المتاح</p>
            <h4 className="text-5xl font-black tabular-nums tracking-tighter">{balance.toLocaleString()} <span className="text-xl">ج.م</span></h4>
          </div>
        </Card>
        
        <Card className="bg-zinc-900 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-zinc-900/20 flex items-center gap-8 group transition-all hover:scale-[1.02]">
          <div className="bg-white/10 p-6 rounded-3xl transition-transform group-hover:rotate-12">
            <Video size={48} />
          </div>
          <div>
            <p className="text-lg font-black opacity-80 uppercase tracking-tighter">جلسات نشطة</p>
            <h4 className="text-5xl font-black tabular-nums tracking-tighter">{activeRequests?.length || 0}</h4>
          </div>
        </Card>

        <Card 
          className="bg-accent text-white rounded-[2.5rem] p-10 shadow-2xl shadow-accent/20 flex items-center gap-8 group transition-all hover:scale-[1.02] cursor-pointer"
          onClick={() => setShowReviews(true)}
        >
          <div className="bg-white/20 p-6 rounded-3xl text-white transition-transform group-hover:rotate-12">
            <Star size={48} fill="white" />
          </div>
          <div>
            <p className="text-lg font-black opacity-80 uppercase tracking-tighter">التقييم العام</p>
            <h4 className="text-5xl font-black tabular-nums tracking-tighter">{avgRating}</h4>
          </div>
        </Card>
      </div>

      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black text-primary">مراجعات الطلاب</DialogTitle>
            <UIDialogDescription className="text-right text-lg font-bold text-muted-foreground">ماذا يقول الطلاب عن محاضراتك وتأثيرك.</UIDialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[450px] overflow-y-auto p-4 custom-scrollbar">
            {completedRequests?.filter(r => r.review).map((r) => (
              <div key={r.id} className="p-6 bg-primary/5 rounded-[2rem] space-y-3 border-2 border-primary/5 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg text-primary">{r.studentName}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${r.rating >= s ? 'fill-accent text-accent' : 'text-zinc-200'}`} />)}
                  </div>
                </div>
                <p className="text-lg italic text-zinc-700 leading-relaxed font-bold">"{r.review}"</p>
              </div>
            ))}
            {(!completedRequests || completedRequests.filter(r => r.review).length === 0) && (
              <div className="text-center py-16 text-muted-foreground font-black text-xl opacity-30">لا توجد تعليقات مكتوبة بعد.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {activeRequests && activeRequests.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-3xl font-black flex items-center gap-4 border-r-[12px] border-primary pr-8 text-zinc-900">
            <Activity className="text-primary h-8 w-8" /> جلساتك النشطة حالياً
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeRequests.map((req) => (
              <Card key={req.id} className="border-4 border-primary/10 rounded-[3rem] p-10 bg-white shadow-xl flex justify-between items-center group">
                <div className="space-y-3">
                  <h5 className="font-black text-3xl text-zinc-800 leading-tight group-hover:text-primary transition-colors">{req.title}</h5>
                  <p className="text-lg text-muted-foreground font-black">مع الطالب: <span className="text-primary">{req.studentName}</span></p>
                </div>
                <Button onClick={() => window.location.href = `/meeting/${req.id}`} className="h-20 px-10 rounded-3xl font-black text-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30">
                  دخول البث
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-12 pt-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 bg-white p-10 md:p-14 rounded-[4rem] border-4 border-dashed border-primary/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <h3 className="text-3xl md:text-5xl font-black font-headline flex items-center gap-6 relative z-10 text-zinc-900">
            <div className="bg-primary/10 p-4 rounded-[2rem]">
              <BookOpen className="text-primary h-10 w-10 md:h-14 md:w-14" />
            </div>
            الطلبات المتاحة
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto relative z-10">
            <Select value={filterMain} onValueChange={setFilterMain}>
              <SelectTrigger className="h-14 rounded-xl border-2 font-black text-sm px-4">
                <Layers className="h-4 w-4 ml-2 text-primary" />
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-black">كل الأقسام</SelectItem>
                {allCategories?.filter(c => c.type === 'main' || !c.type).map(c => (
                  <SelectItem key={c.id} value={c.name} className="font-black">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSub} onValueChange={setFilterSub}>
              <SelectTrigger className="h-14 rounded-xl border-2 font-black text-sm px-4">
                <Filter className="h-4 w-4 ml-2 text-accent" />
                <SelectValue placeholder="التخصص" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-black">كل التخصصات</SelectItem>
                {allCategories?.filter(c => c.type === 'sub').map(c => (
                  <SelectItem key={c.id} value={c.name} className="font-black">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOption} onValueChange={setFilterOption}>
              <SelectTrigger className="h-14 rounded-xl border-2 font-black text-sm px-4">
                <Settings2 className="h-4 w-4 ml-2 text-purple-500" />
                <SelectValue placeholder="خيارات" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-black">كل الخيارات</SelectItem>
                {allCategories?.filter(c => c.type === 'option').map(c => (
                  <SelectItem key={c.id} value={c.name} className="font-black">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-32 text-3xl font-black animate-pulse text-primary/40">جاري البحث عن فرص جديدة...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredAvailable?.map((req) => (
              <Card key={req.id} className="overflow-hidden border-2 border-primary/5 hover:border-primary transition-all group shadow-2xl hover:shadow-primary/10 rounded-[3.5rem] bg-white">
                <CardHeader className="bg-primary/5 pb-10 px-10 pt-10">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-zinc-900 text-white px-6 py-2 text-md font-black rounded-xl shadow-lg border-none">{req.category}</Badge>
                    <div className="flex items-center font-black text-primary text-4xl tabular-nums tracking-tighter">
                      {req.amount}
                      <span className="text-sm mr-2 opacity-60">ج.م</span>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-black mt-10 leading-tight group-hover:text-primary transition-colors h-24 line-clamp-2 text-zinc-800">
                    {req.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-accent font-black mt-4 bg-white/50 w-fit px-4 py-2 rounded-xl">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">{new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  {req.attachmentUrl && (
                    <div className="bg-accent/5 p-5 rounded-2xl flex items-center gap-4 text-lg font-black text-accent border-2 border-accent/5">
                      <FileText size={24} /> الطالب أرفق صورة للمسألة
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    <span className="text-muted-foreground text-sm font-black uppercase tracking-wider">صاحب الاستفهام:</span>
                    <div className="font-black text-2xl flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-primary/20">
                        {(req.studentName || "ف")?.charAt(0)}
                      </div>
                      <span className="text-zinc-800">{req.studentName || "مستفهم"}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAcceptRequest(req)}
                    className="w-full bg-primary hover:bg-primary/90 py-10 md:py-12 font-black text-3xl rounded-[2.5rem] shadow-[0_25px_50px_rgba(41,182,246,0.2)] transition-all hover:scale-[1.03] active:scale-95"
                  >
                    أنا أقدر أفهِّمك
                  </Button>
                </CardContent>
              </Card>
            ))}
            {(!filteredAvailable || filteredAvailable.length === 0) && (
              <div className="col-span-full py-40 text-center text-muted-foreground border-[6px] border-dashed rounded-[5rem] text-2xl md:text-4xl font-black bg-primary/5 opacity-30">
                لا توجد طلبات استفهام متاحة حالياً.. كن أول المستعدين!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
