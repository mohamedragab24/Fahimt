
"use client";

import { useState, useRef } from "react";
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
  Settings2,
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { refineRequest } from "@/ai/flows/refine-request-flow";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-black animate-pulse text-primary text-2xl">جاري تحميل منصة فهمني...</div>;

  if (!user || !profile) {
    return <LandingPage router={router} settings={settings} />;
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10" dir="rtl">
      {/* الترحيب وتنبيه الاعتماد */}
      <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-2 border-primary/5">
        {!profile.isProfileApproved && (
          <div className="mb-6 p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl flex items-center gap-4 text-orange-700 animate-pulse">
            <ShieldAlert />
            <span className="font-bold text-sm">ملفك الشخصي قيد المراجعة؛ صورتك وبياناتك ستظهر للعامة فور اعتمادها من الإدارة.</span>
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-black text-primary/80">أهلاً بك يا {profile.role === "mufhem" ? "مُفهم" : "مُستفهم"}!</h1>
            <div className="flex items-center gap-4">
              <span className="text-5xl md:text-7xl font-black text-primary tracking-tighter">{profile.fullName}</span>
              {profile.isVerified && <ShieldCheck className="text-blue-500 h-10 w-10" />}
            </div>
            <p className="text-muted-foreground text-xl font-bold">
              {profile.role === "mufhem" ? "شارك خبرتك وابدأ في استقبال الاستفهامات التعليمية." : "اطرح استفهامك الآن وسيقوم نخبة المفهمين بمساعدتك."}
            </p>
          </div>
          <div className="flex flex-col items-center bg-muted/20 p-8 rounded-3xl">
            <TrendingUp className="text-accent mb-2" />
            <span className="text-xs font-black uppercase text-muted-foreground">الرتبة</span>
            <Badge className="mt-2 px-6 py-2 text-md font-black">{profile.role === "mufhem" ? "مُفهم معتمد" : "مُستفهم طموح"}</Badge>
          </div>
        </div>
      </div>

      {profile.role === "mustafhem" ? <MustafhemView profile={profile} settings={settings} /> : <MufhemView profile={profile} settings={settings} />}
    </div>
  );
}

function LandingPage({ router, settings }: any) {
  const landingImage = settings?.landingBg || PlaceHolderImages.find(img => img.id === 'landing-bg')?.imageUrl || "";
  
  return (
    <div className="min-h-screen bg-white font-body" dir="rtl">
      <header className="absolute top-0 left-0 w-full z-50 px-6 md:px-16 py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/login')} className="bg-primary font-black rounded-full px-8 py-6 text-lg shadow-xl">حساب جديد</Button>
          <Button variant="ghost" onClick={() => router.push('/login')} className="text-white font-black text-lg">دخول</Button>
        </div>
        <nav className="hidden lg:flex items-center gap-10 text-white font-black text-lg">
          <Link href="/requests">تصفح الاستفهامات</Link>
          <Link href="/teachers">المفهمين</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-black text-white font-headline">فهمني</span>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">ف</div>
        </div>
      </header>

      <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        <Image src={landingImage} alt="Bg" fill className="object-cover brightness-[0.3]" priority />
        <div className="relative z-10 space-y-8 max-w-5xl px-4">
          <h1 className="text-6xl md:text-8xl font-black text-white leading-tight">أول منصة عربية لخدمات الشرح الفوري</h1>
          <p className="text-2xl md:text-4xl text-zinc-200 font-bold opacity-90">استفهامات مباشرة تُحل خصيصاً من أجلك</p>
          
          <div className="mt-12 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center bg-white rounded-3xl overflow-hidden shadow-2xl p-3">
            <div className="flex-1 w-full">
              <Input placeholder="ما هو الموضوع الذي تود استفهامه؟" className="h-16 border-none text-2xl font-black text-right px-8 focus-visible:ring-0" />
            </div>
            <Button onClick={() => router.push('/login')} className="h-16 px-12 text-2xl font-black rounded-2xl w-full md:w-auto">استفهم الآن</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MustafhemView({ profile, settings }: any) {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIstifham, setNewIstifham] = useState({ title: "", amount: "", category: "", categorySub: "", meetingTime: "" });
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: categories } = useCollection(categoriesQuery);

  const handleCreate = async () => {
    if (!firestore || !newIstifham.title || !newIstifham.category) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى ملء البيانات الأساسية." });
      return;
    }

    await addDocumentNonBlocking(collection(firestore, "istifhams"), {
      ...newIstifham,
      amount: Number(newIstifham.amount),
      status: "pending_approval",
      mustafhemId: profile.id,
      mustafhemName: profile.fullName,
      createdAt: new Date().toISOString()
    });

    setIsDialogOpen(false);
    toast({ title: "تم إرسال الاستفهام", description: "سيظهر للمفهمين فور مراجعته من قبل الإدارة." });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2">
        <div className="space-y-4">
          <h2 className="text-4xl font-black">عندك سؤال؟ <br/> اسأل وهتلاقي اللي يفهِّمك</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-xl">
                <PlusCircle className="ml-2" /> اطلب استفهام جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]" dir="rtl">
              <DialogHeader><DialogTitle className="text-right text-2xl font-black">بماذا تريد أن تستفهم؟</DialogTitle></DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="font-black">عنوان الاستفهام</Label>
                  <Input placeholder="مثال: شرح قانون نيوتن الثاني" value={newIstifham.title} onChange={(e)=>setNewIstifham({...newIstifham, title: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black">القسم</Label>
                    <Select onValueChange={(v)=>setNewIstifham({...newIstifham, category: v})}>
                      <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="اختر القسم"/></SelectTrigger>
                      <SelectContent>
                        {categories?.filter(c => c.type === 'main').map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black">الميزانية (ج.م)</Label>
                    <Input type="number" placeholder="100" value={newIstifham.amount} onChange={(e)=>setNewIstifham({...newIstifham, amount: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-black">توقيت المحاضرة</Label>
                  <Input type="datetime-local" onChange={(e)=>setNewIstifham({...newIstifham, meetingTime: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
              <DialogFooter><Button onClick={handleCreate} className="w-full h-14 text-xl font-black rounded-2xl">إرسال للمراجعة</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="hidden md:block">
          <BookOpen size={120} className="text-primary opacity-20" />
        </div>
      </div>
    </div>
  );
}

function MufhemView({ profile, settings }: any) {
  const firestore = useFirestore();
  const istifhamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), where("status", "==", "active"), limit(20));
  }, [firestore]);
  const { data: istifhams, isLoading } = useCollection(istifhamsQuery);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80">الرصيد المتاح</p>
          <h3 className="text-5xl font-black tabular-nums">0 <span className="text-xl">ج.م</span></h3>
        </Card>
        <Card className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80">استفهامات منتهية</p>
          <h3 className="text-5xl font-black tabular-nums">0</h3>
        </Card>
        <Card className="bg-accent text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80">التقييم العام</p>
          <h3 className="text-5xl font-black tabular-nums">5.0</h3>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-3xl font-black border-r-8 border-primary pr-6">استفهامات بانتظار مُفهم</h3>
        {isLoading ? <div className="text-center py-20 animate-pulse font-black">جاري البحث...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {istifhams?.map(ist => (
              <Card key={ist.id} className="p-8 rounded-[2.5rem] border-2 shadow-lg hover:border-primary transition-all">
                <Badge className="mb-4">{ist.category}</Badge>
                <h4 className="text-2xl font-black mb-4">{ist.title}</h4>
                <div className="flex justify-between items-center pt-6 border-t border-dashed">
                  <span className="font-black text-primary text-2xl">{ist.amount} ج.م</span>
                  <Button className="rounded-xl font-bold">أنا أقدر أفهمك</Button>
                </div>
              </Card>
            ))}
            {istifhams?.length === 0 && <div className="col-span-full py-20 text-center text-muted-foreground font-black opacity-30">لا توجد استفهامات متاحة حالياً.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
