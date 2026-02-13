
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PlusCircle, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert,
  Layers,
  Filter,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
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
      <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-2 border-primary/5">
        {!profile.isProfileApproved && (
          <div className="mb-6 p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl flex items-center gap-4 text-orange-700 animate-pulse">
            <ShieldAlert />
            <span className="font-bold text-sm">ملفك الشخصي قيد المراجعة؛ صورتك وبياناتك ستظهر للمُفهمين فور اعتمادها من الإدارة.</span>
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-right">
            <h1 className="text-2xl md:text-3xl font-black text-primary/80">أهلاً بك يا {profile.role === "mufhem" ? "مُفهم" : "مُستفهم"}!</h1>
            <div className="flex items-center gap-4 justify-end md:justify-start">
              <span className="text-5xl md:text-7xl font-black text-primary tracking-tighter">{profile.fullName}</span>
              {profile.isVerified && <ShieldCheck className="text-blue-500 h-10 w-10" />}
            </div>
            <p className="text-muted-foreground text-xl font-bold">
              {profile.role === "mufhem" ? "شارك خبرتك وابدأ في استقبال الاستفهامات التعليمية المعتمدة." : "اطرح استفهامك الآن وسيقوم نخبة المفهمين بمساعدتك فور مراجعة طلبك."}
            </p>
          </div>
          <div className="flex flex-col items-center bg-muted/20 p-8 rounded-3xl">
            <TrendingUp className="text-accent mb-2" />
            <span className="text-xs font-black uppercase text-muted-foreground">الحالة الحالية</span>
            <Badge className="mt-2 px-6 py-2 text-md font-black">{profile.role === "mufhem" ? "مُفهم معتمد" : "مُستفهم طموح"}</Badge>
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
          <Button onClick={() => router.push('/login')} className="bg-primary font-black rounded-full px-8 py-6 text-lg shadow-xl">حساب جديد</Button>
          <Button variant="ghost" onClick={() => router.push('/login')} className="text-white font-black text-lg">دخول</Button>
        </div>
        <nav className="hidden lg:flex items-center gap-10 text-white font-black text-lg">
          <Link href="/requests">الاستفهامات</Link>
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
          <p className="text-2xl md:text-4xl text-zinc-200 font-bold opacity-90">مُفهمين خبراء لخدمة كل مُستفهم طموح</p>
          
          <div className="mt-12 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center bg-white rounded-3xl overflow-hidden shadow-2xl p-3">
            <div className="flex-1 w-full">
              <Input placeholder="ما هو الموضوع الذي تود استفهامه؟" className="h-16 border-none text-2xl font-black text-right px-8 focus-visible:ring-0" />
            </div>
            <Button onClick={() => router.push('/login')} className="h-16 px-12 text-2xl font-black rounded-2xl w-full md:w-auto">ابدأ الآن</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MustafhemView({ profile }: any) {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIstifham, setNewIstifham] = useState({ title: "", description: "", amount: "", category: "", subCategory: "", meetingTime: "" });
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: categories } = useCollection(categoriesQuery);

  const pendingIstifhamsQuery = useMemoFirebase(() => {
    if (!firestore || !profile.id) return null;
    return query(collection(firestore, "istifhams"), where("mustafhemId", "==", profile.id), where("status", "==", "pending_approval"), limit(5));
  }, [firestore, profile.id]);
  const { data: pendingIstifhams } = useCollection(pendingIstifhamsQuery);

  const handleCreate = async () => {
    if (!newIstifham.title || !newIstifham.description || !newIstifham.category || !newIstifham.subCategory || !newIstifham.amount || !newIstifham.meetingTime) {
      toast({ 
        variant: "destructive", 
        title: "بيانات ناقصة", 
        description: "كافة الحقول إجبارية لضمان قبول استفهامك." 
      });
      return;
    }

    if (firestore) {
      await addDocumentNonBlocking(collection(firestore, "istifhams"), {
        ...newIstifham,
        amount: Number(newIstifham.amount),
        status: "pending_approval",
        mustafhemId: profile.id,
        mustafhemName: profile.fullName,
        createdAt: new Date().toISOString()
      });

      setIsDialogOpen(false);
      setNewIstifham({ title: "", description: "", amount: "", category: "", subCategory: "", meetingTime: "" });
      toast({ title: "تم الإرسال للمراجعة", description: "سيتم إشعارك فور اعتماد الاستفهام ونشره للمُفهمين." });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2">
        <div className="space-y-4 text-right">
          <h2 className="text-4xl font-black text-zinc-800">عندك سؤال؟ <br/> اطرح استفهامك الآن</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-xl">
                <PlusCircle className="ml-2" /> اطلب استفهام جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] rounded-[2.5rem]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right text-3xl font-black">تفاصيل الاستفهام الجديد</DialogTitle>
                <DialogDescription className="text-right">يرجى ملء كافة الحقول لضمان وصول طلبك لأفضل المُفهمين.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 max-h-[60vh] overflow-y-auto px-2">
                <div className="space-y-2">
                  <Label className="font-black flex items-center gap-2">عنوان الاستفهام (إجباري)</Label>
                  <Input placeholder="مثال: شرح أساسيات الكيمياء العضوية" value={newIstifham.title} onChange={(e)=>setNewIstifham({...newIstifham, title: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black">وصف المشكلة بالتفصيل (إجباري)</Label>
                  <textarea 
                    placeholder="اشرح ما الذي تود فهمه بالتحديد..." 
                    value={newIstifham.description} 
                    onChange={(e)=>setNewIstifham({...newIstifham, description: e.target.value})}
                    className="w-full min-h-[120px] p-4 rounded-xl border-2 focus:ring-2 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black flex items-center gap-2"><Layers size={14}/> القسم (إجباري)</Label>
                    <Select onValueChange={(v)=>setNewIstifham({...newIstifham, category: v, subCategory: ""})}>
                      <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="اختر القسم"/></SelectTrigger>
                      <SelectContent>
                        {categories?.filter(c => c.type === 'main' || !c.type).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black flex items-center gap-2"><Filter size={14}/> التخصص (إجباري)</Label>
                    <Select disabled={!newIstifham.category} onValueChange={(v)=>setNewIstifham({...newIstifham, subCategory: v})}>
                      <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="اختر التخصص"/></SelectTrigger>
                      <SelectContent>
                        {categories?.filter(c => c.type === 'sub' && c.parentId === categories.find(main => main.name === newIstifham.category)?.id).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black">الميزانية (ج.م) (إجباري)</Label>
                    <Input type="number" placeholder="100" value={newIstifham.amount} onChange={(e)=>setNewIstifham({...newIstifham, amount: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black">توقيت المحاضرة المقترح (إجباري)</Label>
                    <Input type="datetime-local" value={newIstifham.meetingTime} onChange={(e)=>setNewIstifham({...newIstifham, meetingTime: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} className="w-full h-14 text-xl font-black rounded-2xl shadow-lg">إرسال للمراجعة والاعتماد</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="hidden md:block">
          <BookOpen size={120} className="text-primary opacity-20" />
        </div>
      </div>

      {pendingIstifhams && pendingIstifhams.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-black border-r-8 border-orange-500 pr-6">استفهاماتك قيد المراجعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingIstifhams.map(ist => (
              <Card key={ist.id} className="p-6 rounded-[2rem] border-2 border-orange-100 bg-orange-50/30">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-orange-100 text-orange-600 border-none font-bold">بانتظار الإدارة</Badge>
                  <Clock className="text-orange-400 h-4 w-4" />
                </div>
                <h4 className="text-lg font-black truncate">{ist.title}</h4>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ist.description}</p>
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
          <p className="font-bold opacity-80">استفهامات منجزة</p>
          <h3 className="text-5xl font-black tabular-nums">0</h3>
        </Card>
        <Card className="bg-accent text-white rounded-[2.5rem] p-8 shadow-xl">
          <p className="font-bold opacity-80">تقييمك العام</p>
          <h3 className="text-5xl font-black tabular-nums">5.0</h3>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-3xl font-black border-r-8 border-primary pr-6">استفهامات معتمدة متاحة الآن</h3>
        {isLoading ? <div className="text-center py-20 animate-pulse font-black">جاري جلب الاستفهامات...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {istifhams?.map(ist => (
              <Card key={ist.id} className="p-8 rounded-[2.5rem] border-2 shadow-lg hover:border-primary transition-all bg-white group">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="px-3 py-1 font-bold">{ist.category}</Badge>
                  <span className="text-xs font-bold text-muted-foreground">{new Date(ist.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <h4 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors text-right">{ist.title}</h4>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 font-medium text-right">{ist.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-dashed">
                  <span className="font-black text-primary text-2xl">{ist.amount} <span className="text-xs">ج.م</span></span>
                  <Button className="rounded-xl font-black px-6">أنا أفهمك</Button>
                </div>
              </Card>
            ))}
            {istifhams?.length === 0 && (
              <div className="col-span-full py-20 text-center bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted-foreground/20">
                <p className="text-muted-foreground font-black text-xl opacity-40">لا توجد استفهامات معتمدة متاحة حالياً.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
