
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ArrowLeft,
  GraduationCap,
  Users2,
  Video,
  Wallet,
  Star,
  Activity,
  ArrowRight,
  HelpCircle,
  Zap,
  Globe,
  Check,
  Search,
  Wand2,
  PieChart,
  Bot
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy, getDocs } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { refineRequest } from "@/ai/flows/refine-request-flow";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري التحميل...</div>;

  if (!user || !profile) {
    return <LandingPage router={router} firestore={firestore} />;
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
      <div className="relative overflow-hidden bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-primary/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="text-primary h-6 w-6 md:h-8 md:w-8" />
              {profile.role === "mufhem" ? "أهلاً يا مُفهم!" : "أهلاً يا مُستفهم!"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="block text-primary text-4xl md:text-6xl font-black">{profile.fullName || "مستخدم فهمني"}</span>
              {profile.role === 'mufhem' && (
                <div className="bg-blue-500 p-1.5 rounded-full shadow-lg animate-pulse">
                  <ShieldCheck className="text-white h-6 w-6 md:h-8 md:w-8" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed">
              {profile.role === "mufhem" 
                ? "لديك فرصة لمساعدة الطلاب ومشاركة خبراتك وتحقيق دخل إضافي اليوم." 
                : "ابحث عن المساعدة التي تحتاجها في دراستك أو مهاراتك من أفضل الخبراء الموثقين."}
            </p>
          </div>
          <div className="flex flex-col items-center bg-primary/5 p-6 md:p-8 rounded-3xl border-2 border-primary/10">
            <TrendingUp className="text-primary h-8 w-8 md:h-10 md:w-10 mb-2" />
            <span className="text-xs md:sm text-muted-foreground font-bold">الرتبة الحالية</span>
            <Badge className="mt-2 px-6 py-2 text-md font-bold bg-primary shadow-lg flex items-center gap-2">
              {profile.role === "mufhem" ? (
                <><ShieldCheck className="h-4 w-4" /> مُفهم معتمد</>
              ) : "مُستفهم طموح"}
            </Badge>
          </div>
        </div>
      </div>

      {profile.role === "mustafhem" ? <StudentView profile={profile} /> : <TeacherView profile={profile} />}
    </div>
  );
}

function LandingPage({ router, firestore }: { router: any, firestore: any }) {
  const [counts, setCounts] = useState({ users: 1500, hours: 4500, experts: 150 });

  useEffect(() => {
    // Only attempt fetch if firestore is ready.
    // Note: guest users cannot query 'users' or 'requests' due to security rules.
    // We will only fetch if we want to show real-time stats to logged-in users, 
    // otherwise we keep the realistic static counts.
  }, [firestore]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-accent rounded-full blur-3xl"></div>
        </div>
        <div className="container px-4 text-center space-y-10 relative z-10">
          <Badge className="h-10 px-6 rounded-full text-lg font-bold mb-4 animate-bounce">مرحباً بك في مستقبل التعليم العربي 🚀</Badge>
          <h1 className="text-5xl md:text-8xl font-black font-headline tracking-tighter leading-tight">
            متشيلش هم.. <br/> <span className="text-primary">فهمني</span> هيفهمك
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            المنصة الأولى التي تجمع بين الطلاب والخبراء في بث مباشر فوري. تعلم، تواصل، وتفوق مع أفضل "المفهمين" الموثقين.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Button size="lg" onClick={() => router.push('/login')} className="h-16 px-12 rounded-2xl text-xl font-black shadow-2xl hover:scale-105 transition-all">
              ابدأ رحلتك الآن <ArrowLeft className="mr-3" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/login')} className="h-16 px-12 rounded-2xl text-xl font-bold border-2">
              تسجيل دخول
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container px-4 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">كيف يعمل "فهمني"؟</h2>
            <p className="text-muted-foreground text-xl">خطوات بسيطة تبدأ بها رحلتك التعليمية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Step icon={PlusCircle} number="1" title="اطلب استفهام" desc="حدد المادة والميزانية والموعد." />
            <Step icon={Users2} number="2" title="اختر خبيراً" desc="يقوم المدرسون بقبول طلبك فوراً." />
            <Step icon={Video} number="3" title="ابدأ التعلم" desc="ادخل غرفة البث المباشر وابدأ الفهم." />
            <Step icon={Check} number="4" title="قيم التجربة" desc="ساعدنا على التحسين بتقييم المدرس." />
          </div>
        </div>
      </section>

      <section className="py-24 container px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
        <LandingFeature 
          icon={Video} 
          title="بث مباشر فوري" 
          desc="لا تنتظر ردوداً مسجلة، تواصل مع المدرس فوراً في غرفة فيديو خاصة وآمنة."
        />
        <LandingFeature 
          icon={ShieldCheck} 
          title="مفهمين موثقين" 
          desc="كل المدرسين لدينا يمرون بعملية تدقيق لضمان جودة المعلومة التي تصلك."
        />
        <LandingFeature 
          icon={BadgeCent} 
          title="أسعار مرنة" 
          desc="أنت من يحدد الميزانية، وهناك دائماً خبير مستعد لمساعدتك بالسعر المناسب."
        />
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container px-4 max-w-4xl space-y-12">
          <h2 className="text-4xl font-black text-center">الأسئلة الشائعة</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white px-6 rounded-2xl border-none shadow-sm">
              <AccordionTrigger className="text-xl font-bold hover:no-underline">هل أحتاج لجهاز كمبيوتر؟</AccordionTrigger>
              <AccordionContent className="text-lg text-muted-foreground leading-relaxed">
                لا، يمكنك استخدام "فهمني" من أي هاتف ذكي أو تابلت عبر المتصفح أو تطبيقنا الرسمي بكل سهولة.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-white px-6 rounded-2xl border-none shadow-sm">
              <AccordionTrigger className="text-xl font-bold hover:no-underline">كيف يتم الدفع للمدرس؟</AccordionTrigger>
              <AccordionContent className="text-lg text-muted-foreground leading-relaxed">
                يتم خصم المبلغ من محفظتك عند اكتمال المحاضرة، ويقوم التطبيق بتحويل الأرباح للمدرس تلقائياً.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-white px-6 rounded-2xl border-none shadow-sm">
              <AccordionTrigger className="text-xl font-bold hover:no-underline">ماذا لو لم يلتزم المدرس بالموعد؟</AccordionTrigger>
              <AccordionContent className="text-lg text-muted-foreground leading-relaxed">
                يمكنك رفع تذكرة دعم وسيقوم فريقنا بمراجعة الحالة وإعادة المبلغ لمحفظتك فوراً إذا ثبت عدم الالتزام.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="bg-zinc-900 text-white py-20">
        <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-right">
            <h2 className="text-4xl font-black">انضم لآلاف الطلاب</h2>
            <p className="text-zinc-400 text-lg">أكثر من {counts.hours.toLocaleString()} ساعة تعليمية تمت بنجاح.</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-primary">+{counts.users.toLocaleString()}</div>
              <div className="text-sm text-zinc-500">مستخدم نشط</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-accent">+{counts.experts.toLocaleString()}</div>
              <div className="text-sm text-zinc-500">مفهم معتمد</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ icon: Icon, number, title, desc }: any) {
  return (
    <div className="text-center space-y-4 relative">
      <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-xl relative z-10">
        <Icon size={32} />
        <span className="absolute -top-2 -right-2 bg-accent w-8 h-8 rounded-full border-4 border-white text-xs flex items-center justify-center">{number}</span>
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="text-muted-foreground text-sm font-medium">{desc}</p>
    </div>
  );
}

function LandingFeature({ icon: Icon, title, desc }: any) {
  return (
    <Card className="rounded-[2.5rem] p-8 border-2 hover:border-primary transition-all text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
        <Icon size={32} />
      </div>
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}

function StudentView({ profile }: { profile: any }) {
  const firestore = useFirestore();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", amount: "", category: "", meetingTime: "", attachmentUrl: "" });
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

  const { data: categories } = useCollection(categoriesQuery);

  const myRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef || !profile?.id) return null;
    return query(
      requestsRef, 
      where("studentId", "==", profile.id), 
      limit(20)
    );
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
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال جميع بيانات الطلب." });
      return;
    }

    addDocumentNonBlocking(requestsRef, {
      title: newRequest.title,
      amount: Number(newRequest.amount),
      category: newRequest.category,
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
    setNewRequest({ title: "", amount: "", category: "", meetingTime: "", attachmentUrl: "" });
    setFileName("");
    toast({
      title: "تم إرسال الطلب بنجاح",
      description: "سيتم إخطارك فور قبول أحد المفهمين لطلبك.",
    });
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-br from-primary via-primary to-accent rounded-[2.5rem] text-white shadow-2xl text-center space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://picsum.photos/seed/learn/1000/1000')] bg-cover transition-transform group-hover:scale-110 duration-1000"></div>
          <h2 className="text-3xl md:text-4xl font-black font-headline max-w-4xl leading-tight relative z-10 drop-shadow-lg">
            إيه اللي واقف معاك؟ <br/> اسأل وهتلاقي اللي يفهِّمك بجد
          </h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-6 text-xl rounded-full shadow-xl transition-all hover:scale-105 font-black relative z-10">
                <PlusCircle className="ml-3 h-6 w-6" />
                اطلب استفهام الآن
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-3xl font-bold">ماذا تريد أن تتعلم اليوم؟</DialogTitle>
                <DialogDescription className="text-right text-lg">أرفق صوراً للمسائل أو استخدم الذكاء الاصطناعي لتحسين طلبك.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2 relative">
                  <Label htmlFor="title" className="text-lg font-bold">عنوان الطلب</Label>
                  <div className="relative">
                    <Input 
                      id="title" 
                      placeholder="مثلاً: شرح درس التفاضل للصف الثالث الثانوي" 
                      value={newRequest.title} 
                      onChange={(e) => setNewRequest({...newRequest, title: e.target.value})} 
                      className="h-14 rounded-xl pr-4 pl-12" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleAiRefine}
                      disabled={isAiRefining}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-primary hover:bg-primary/10 rounded-lg h-10 w-10"
                    >
                      <Wand2 className={`h-5 w-5 ${isAiRefining ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-lg font-bold">التصنيف</Label>
                    <Select value={newRequest.category} onValueChange={(v) => setNewRequest({...newRequest, category: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-lg font-bold">المبلغ (ج.م)</Label>
                    <Input id="amount" type="number" placeholder="100" value={newRequest.amount} onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingTime" className="text-lg font-bold">تاريخ ووقت المحاضرة المطلوب</Label>
                  <Input id="meetingTime" type="datetime-local" value={newRequest.meetingTime} onChange={(e) => setNewRequest({...newRequest, meetingTime: e.target.value})} className="h-12 rounded-xl" />
                </div>
                
                <div className="space-y-4">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <Upload size={18} /> إرفاق ملفات أو صور (اختياري)
                  </Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    {fileName ? (
                      <div className="flex items-center justify-center gap-3 font-bold text-primary">
                        <FileText /> {fileName}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFileName(""); setNewRequest({...newRequest, attachmentUrl: ""}); }}><X size={14} /></Button>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <Bot className="h-10 w-10 opacity-20" />
                        اضغط هنا لرفع صورة المسألة للتحليل
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateRequest} className="w-full py-6 text-xl font-black rounded-xl">
                  <Send className="ml-3 h-6 w-6" /> إرسال الطلب الآن
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="bg-primary/10 p-4 rounded-3xl">
            <Users2 className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black">اكتشف أفضل المدرسين</h3>
            <p className="text-muted-foreground font-medium">يمكنك الاطلاع على قائمة المدرسين الموثقين وتخصصاتهم قبل البدء.</p>
          </div>
          <Button onClick={() => router.push('/teachers')} className="h-14 px-8 rounded-2xl font-bold text-lg">
            تصفح قائمة "المفهمين"
          </Button>
        </Card>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl md:text-3xl font-black font-headline border-r-8 border-primary pr-6">طلباتك الأخيرة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myRequests.map((req: any) => (
            <Card key={req.id} className="shadow-lg border-2 hover:border-primary/50 hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden group">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="px-4 py-1 text-md font-bold bg-primary/10 text-primary border-none">{req.category}</Badge>
                  <span className="text-2xl font-black text-primary">{req.amount} ج.م</span>
                </div>
                <h4 className="font-bold text-2xl leading-tight h-16 line-clamp-2 group-hover:text-primary transition-colors">{req.title}</h4>
                <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 p-3 rounded-xl">
                  <CalendarDays className="h-5 w-5" />
                  <span className="text-sm">{new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-dashed">
                  <div className="flex items-center text-md text-muted-foreground font-medium">
                    <Clock className="h-5 w-5 ml-2 text-primary/60" />
                    {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                  <Badge className={`px-4 py-1 text-md font-bold ${
                    req.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                    req.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 
                    req.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'accepted' ? 'تم القبول' : req.status === 'completed' ? 'مكتمل' : 'ملغي'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {myRequests.length === 0 && (
            <div className="col-span-full py-24 text-center text-muted-foreground border-4 border-dashed rounded-[3rem] text-xl md:text-2xl font-bold bg-muted/5">
              لا توجد طلبات سابقة.. ابدأ بطلبك الأول الآن!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeacherView({ profile }: { profile: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filterCategory, setFilterCategory] = useState("all");
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

  const { data: categories } = useCollection(categoriesQuery);

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

  const filteredAvailable = availableRequests?.filter(r => 
    filterCategory === "all" || r.category === filterCategory
  );

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white rounded-3xl p-8 shadow-xl flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-sm font-bold opacity-80">الرصيد المتاح</p>
            <h4 className="text-3xl font-black">{balance.toLocaleString()} ج.م</h4>
          </div>
        </Card>
        
        <Card className="bg-accent text-white rounded-3xl p-8 shadow-xl flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Video size={32} />
          </div>
          <div>
            <p className="text-sm font-bold opacity-80">جلسات نشطة</p>
            <h4 className="text-3xl font-black">{activeRequests?.length || 0}</h4>
          </div>
        </Card>

        <Card 
          className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl flex items-center gap-6 cursor-pointer hover:bg-zinc-800 transition-colors"
          onClick={() => setShowReviews(true)}
        >
          <div className="bg-white/20 p-4 rounded-2xl text-yellow-400">
            <Star size={32} fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-bold opacity-80">التقييم العام</p>
            <h4 className="text-3xl font-black">{avgRating}</h4>
          </div>
        </Card>
      </div>

      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-black">مراجعات الطلاب</DialogTitle>
            <DialogDescription className="text-right">ماذا يقول الطلاب عن محاضراتك.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
            {completedRequests?.filter(r => r.review).map((r) => (
              <div key={r.id} className="p-4 bg-muted/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{r.studentName}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${r.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />)}
                  </div>
                </div>
                <p className="text-sm italic text-muted-foreground leading-relaxed">"{r.review}"</p>
              </div>
            ))}
            {(!completedRequests || completedRequests.filter(r => r.review).length === 0) && (
              <div className="text-center py-10 text-muted-foreground font-bold">لا توجد تعليقات مكتوبة بعد.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {activeRequests && activeRequests.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black flex items-center gap-3 border-r-8 border-primary pr-6">
            <Activity className="text-primary" /> جلساتك النشطة حالياً
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeRequests.map((req) => (
              <Card key={req.id} className="border-2 border-primary/20 rounded-3xl p-6 bg-white shadow-md flex justify-between items-center">
                <div className="space-y-2">
                  <h5 className="font-bold text-lg">{req.title}</h5>
                  <p className="text-xs text-muted-foreground font-bold">مع الطالب: {req.studentName}</p>
                </div>
                <Button onClick={() => window.location.href = `/meeting/${req.id}`} className="rounded-xl font-bold">
                  دخول البث
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-accent/5 p-6 md:p-8 rounded-[2rem] border-2 border-accent/20 shadow-sm">
          <h3 className="text-xl md:text-3xl font-black font-headline flex items-center gap-4">
            <BookOpen className="text-accent h-6 w-6 md:h-10 md:w-10" /> الطلبات المتاحة للجميع
          </h3>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-64 h-12 rounded-xl border-2">
                <Search className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب التخصص" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التخصصات</SelectItem>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-24 text-2xl font-black animate-pulse">جاري البحث عن طلبات...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredAvailable?.map((req) => (
              <Card key={req.id} className="overflow-hidden border-2 hover:border-accent transition-all group shadow-xl hover:shadow-2xl rounded-[2.5rem] bg-white">
                <CardHeader className="bg-muted/30 pb-6 px-8 pt-8">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-accent text-white px-4 py-1 text-md font-bold rounded-lg shadow-sm">{req.category}</Badge>
                    <div className="flex items-center font-black text-accent text-3xl tabular-nums">
                      <BadgeCent className="h-6 w-6 ml-2" />
                      {req.amount}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black mt-6 leading-tight group-hover:text-primary transition-colors h-16 line-clamp-2">
                    {req.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-accent font-bold mt-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">{new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {req.attachmentUrl && (
                    <div className="bg-primary/5 p-4 rounded-xl flex items-center gap-3 text-sm font-bold text-primary">
                      <FileText size={18} /> الطالب أرفق ملفاً توضيحياً
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <span className="text-muted-foreground text-sm font-bold">المستفهم:</span>
                    <div className="font-bold text-xl flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black border-2 border-primary/20">
                        {(req.studentName || "ف")?.charAt(0)}
                      </div>
                      {req.studentName || "مستفهم"}
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAcceptRequest(req)}
                    className="w-full bg-accent hover:bg-accent/90 py-8 md:py-10 font-black text-2xl rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.03]"
                  >
                    أنا أقدر أفهِّمك
                  </Button>
                </CardContent>
              </Card>
            ))}
            {(!filteredAvailable || filteredAvailable.length === 0) && (
              <div className="col-span-full py-32 text-center text-muted-foreground border-4 border-dashed rounded-[3rem] text-xl md:text-2xl font-bold bg-muted/5">
                لا توجد طلبات استفهام متاحة حالياً في هذا القسم.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
