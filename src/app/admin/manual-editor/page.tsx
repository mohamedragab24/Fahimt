
"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Palette, 
  Type, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Edit3, 
  MousePointer2,
  FileText,
  ShieldCheck,
  Info,
  BookOpen,
  Layers,
  X,
  ImageIcon,
  Upload,
  Link as LinkIcon,
  LayoutTemplate,
  Monitor,
  Smartphone,
  CheckCircle2,
  Menu,
  Home,
  GraduationCap,
  ClipboardList,
  Wallet,
  Settings,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Gavel,
  Lock,
  Target,
  Users,
  Video,
  Star,
  Search,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type PageType = 'home' | 'about' | 'terms' | 'privacy' | 'guarantees' | 'guide' | 'nav' | 'sidebar' | 'dashboards' | 'teachers_list' | 'portfolio_list';

export default function ManualEditorPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<{key: string, label: string, value: string, type: 'text' | 'textarea' | 'image'} | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    siteTitle: "فهمني",
    heroTitle: "أول منصة عربية لخدمات الشرح الفوري",
    heroSubtitle: "مُفهمين خبراء لخدمة كل مُستفهم طموح",
    footerText: "جميع الحقوق محفوظة لمنصة فهمني",
    primaryColor: "#29B6F6",
    accentColor: "#FF7043",
    backgroundColor: "#F8FAFC",
    borderRadius: "1rem",
    // Images
    logoUrl: "",
    landingBg: "",
    aboutImage: "",
    // Buttons
    btnHeroStart: "ابدأ الآن",
    btnHeroLearn: "عن المنصة",
    // Nav Labels
    navHome: "الرئيسية",
    navAbout: "عن المنصة",
    navGuide: "الدليل",
    navGuarantees: "الضمانات",
    // Sidebar Labels
    sideHome: "الرئيسية",
    sideTeachers: "المُفهمين",
    sidePortfolio: "أعمال المفهمين",
    sideRequests: "استفهاماتي",
    sideWallet: "المحفظة",
    sideSettings: "الإعدادات",
    sideAdmin: "لوحة المسؤول",
    sideLogout: "تسجيل الخروج",
    sideToggleToStudent: "تبديل إلى مُستفهم",
    sideToggleToTeacher: "تبديل إلى مُفهم",
    // Pages Content
    aboutTitle: "ما هي منصة فهمني؟",
    aboutDescription: "فهمني هي المنصة العربية الأولى المتخصصة في طلب وتقديم خدمات الشرح الفوري التفاعلي لأغلب التخصصات الأكاديمية والتقنية والمهارية.",
    termsTitle: "شروط الاستخدام",
    termsDescription: "استخدامك لـ 'فهمني' يعني موافقتك الكاملة وغير المشروطة على هذه الشروط المنظمة للعلاقة بيننا.",
    privacyTitle: "سياسة الخصوصية",
    privacyDescription: "كيف تتعامل منصة 'فهمني' مع بياناتك؟ نحن نلتزم بحماية خصوصيتك وتأمين بياناتك.",
    guaranteesTitle: "ضمان الحقوق",
    guaranteesDescription: "نحن في 'فهمني' نلعب دور الوسيط الضامن لتجربة عادلة ومرضية، حيث تبقى حقوقك المالية والمعرفية في أمان تام.",
    guideTitle: "الدليل الإرشادي",
    guideSubtitle: "الدليل الشامل لمستخدمي منصة 'فهمني' لضمان تجربة تعليمية مثمرة وسلسة للطرفين.",
    // New Dashboard Content
    studentDashboardTitle: "عندك سؤال؟ اطرح استفهامك الآن",
    studentDashboardBtn: "طلب استفهام جديد",
    teacherDashboardTitle: "اعرض مهاراتك.. أضف عملاً جديداً لمعرضك",
    teacherDashboardSubtitle: "كلما زادت أعمالك المميزة في المعرض، زادت ثقة الطلاب باختيارك لمشاريعهم.",
    teacherDashboardBtn: "إضافة عمل جديد للمعرض",
    teachersListTitle: "نخبة 'المفهمين' الموثقين",
    teachersListSearchPlaceholder: "ابحث باسم المدرس أو التخصص...",
    portfolioListTitle: "أعمال المفهمين",
    portfolioListSubtitle: "نماذج تعليمية ملهمة من خبراء منصة فهمني.",
    createIstifhamTitle: "تفاصيل الاستفهام",
    createIstifhamBtn: "تأكيد وإرسال للمراجعة"
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "settings", "general"), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث كافة تفاصيل المنصة فوراً." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ التغييرات." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldClick = (key: string, label: string, type: 'text' | 'textarea' | 'image' = 'text') => {
    if (type === 'image') {
      setActiveField({ key, label, value: (formData as any)[key] || "", type });
      fileInputRef.current?.click();
    } else {
      setActiveField({ key, label, value: (formData as any)[key] || "", type });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeField?.type === 'image') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [activeField.key]: reader.result as string });
        setActiveField(null);
        toast({ title: "تم تحديث الصورة في المعاينة" });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateField = () => {
    if (activeField) {
      setFormData({ ...formData, [activeField.key]: activeField.value });
      setActiveField(null);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل المحرر الفائق...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-100" dir="rtl">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      
      {/* Header Toolbar */}
      <header className="h-24 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <LayoutTemplate size={32} />
          </div>
          <div className="hidden md:block">
            <h1 className="text-2xl font-black">المحرر المرئي الفائق</h1>
            <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
              <MousePointer2 size={12} /> اضغط على أي عنصر لتعديله
            </p>
          </div>
        </div>

        <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as PageType)} className="w-full md:w-auto mx-4 max-w-[50%] md:max-w-none">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-14 overflow-x-auto flex-nowrap no-scrollbar justify-start md:justify-center">
            <TabsTrigger value="home" className="rounded-lg font-black px-4 shrink-0">الرئيسية</TabsTrigger>
            <TabsTrigger value="dashboards" className="rounded-lg font-black px-4 shrink-0">لوحات التحكم</TabsTrigger>
            <TabsTrigger value="teachers_list" className="rounded-lg font-black px-4 shrink-0">قائمة المدرسين</TabsTrigger>
            <TabsTrigger value="portfolio_list" className="rounded-lg font-black px-4 shrink-0">معرض الأعمال</TabsTrigger>
            <TabsTrigger value="about" className="rounded-lg font-black px-4 shrink-0">عن المنصة</TabsTrigger>
            <TabsTrigger value="terms" className="rounded-lg font-black px-4 shrink-0">الشروط</TabsTrigger>
            <TabsTrigger value="sidebar" className="rounded-lg font-black px-4 shrink-0">القائمة الجانبية</TabsTrigger>
            <TabsTrigger value="nav" className="rounded-lg font-black px-4 shrink-0">الهيدر والفوتر</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving} className="h-14 px-10 rounded-2xl font-black text-xl shadow-xl">
            {isSaving ? <RefreshCw className="animate-spin ml-2" /> : <Save className="ml-2" />}
            حفظ التغييرات
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 bg-white border-l overflow-y-auto p-6 space-y-8 shrink-0 shadow-xl z-40">
          <div className="space-y-4">
            <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> التصميم العام
            </h3>
            <div className="space-y-6">
              <ColorInput label="اللون الأساسي" value={formData.primaryColor || ""} onChange={(v) => setFormData({...formData, primaryColor: v})} />
              <ColorInput label="لون التمييز" value={formData.accentColor || ""} onChange={(v) => setFormData({...formData, accentColor: v})} />
              <div className="space-y-2">
                <Label className="text-[10px] font-black opacity-60">نصف قطر الزوايا (Radius)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["0px", "0.5rem", "1rem", "2rem", "3rem"].map(r => (
                    <button 
                      key={r} 
                      onClick={()=>setFormData({...formData, borderRadius: r})}
                      className={`h-10 rounded-lg border-2 text-[10px] font-bold ${formData.borderRadius === r ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-100 text-zinc-400'}`}
                    >
                      {r === "0px" ? "حادة" : r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> صور الهوية
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageThumb label="اللوجو" value={formData.logoUrl} onClick={() => handleFieldClick('logoUrl', 'شعار المنصة', 'image')} />
              <ImageThumb label="خلفية الهيرو" value={formData.landingBg} onClick={() => handleFieldClick('landingBg', 'خلفية صفحة الهبوط', 'image')} />
            </div>
          </div>

          <div className="p-6 bg-zinc-900 rounded-[2rem] text-white space-y-4 mt-6">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={18} />
              <h4 className="font-black text-sm">ذكاء التعديل</h4>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 leading-relaxed italic">
              "بمجرد الضغط على زر الحفظ العلوي، سيتم تغيير شكل وتجربة المنصة لكافة المستخدمين في أقل من ثانية واحدة."
            </p>
          </div>
        </aside>

        {/* Live Preview Area */}
        <main className="flex-1 bg-zinc-200/50 p-10 overflow-y-auto flex flex-col items-center">
          <div 
            className="w-full max-w-5xl bg-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden min-h-[1200px] transition-all duration-700"
            style={{ 
              backgroundColor: formData.backgroundColor || "#FFFFFF",
              borderRadius: formData.borderRadius 
            }}
          >
            {/* Nav Preview */}
            <nav className="h-24 border-b flex items-center justify-between px-12 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div 
                  style={{ backgroundColor: formData.primaryColor, borderRadius: `calc(${formData.borderRadius} / 2)` }} 
                  className="w-12 h-12 flex items-center justify-center text-white font-black text-2xl shadow-lg cursor-pointer hover:scale-110 transition-transform overflow-hidden"
                  onClick={() => handleFieldClick('logoUrl', 'الشعار المربع', 'image')}
                >
                  {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-cover" /> : "ف"}
                </div>
                <span 
                  className="font-black text-3xl cursor-pointer hover:text-primary transition-all"
                  style={{ color: formData.primaryColor }}
                  onClick={() => handleFieldClick('siteTitle', 'اسم المنصة')}
                >
                  {formData.siteTitle}
                </span>
              </div>
              <div className="flex gap-8 items-center">
                {['navHome', 'navAbout', 'navGuide', 'navGuarantees'].map(key => (
                  <span 
                    key={key}
                    className="font-black text-sm text-zinc-400 cursor-pointer hover:text-primary"
                    onClick={() => handleFieldClick(key, 'اسم رابط التنقل')}
                  >
                    {(formData as any)[key] || ""}
                  </span>
                ))}
                <div 
                  style={{ backgroundColor: formData.primaryColor, borderRadius: `calc(${formData.borderRadius} / 3)` }} 
                  className="px-6 py-2 text-white text-xs font-black shadow-lg"
                >
                  حساب جديد
                </div>
              </div>
            </nav>

            {/* Dynamic Page Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {currentPage === 'home' && (
                <section className="relative">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={formData.landingBg || PlaceHolderImages.find(i => i.id === 'landing-bg')?.imageUrl} 
                      className="w-full h-full object-cover brightness-[0.4] cursor-pointer hover:brightness-[0.6] transition-all" 
                      onClick={() => handleFieldClick('landingBg', 'خلفية صفحة الهبوط', 'image')}
                    />
                  </div>
                  <div className="relative z-10 py-48 px-12 text-center space-y-12">
                    <h1 
                      className="text-7xl md:text-8xl font-black leading-tight text-white cursor-pointer hover:bg-white/10 p-6 rounded-[3rem] transition-all"
                      onClick={() => handleFieldClick('heroTitle', 'عنوان الهيرو الرئيسي')}
                    >
                      {formData.heroTitle}
                    </h1>
                    <p 
                      className="text-3xl font-bold text-zinc-300 max-w-3xl mx-auto cursor-pointer hover:bg-white/5 p-4 rounded-2xl transition-all"
                      onClick={() => handleFieldClick('heroSubtitle', 'الوصف الفرعي للهيرو')}
                    >
                      {formData.heroSubtitle}
                    </p>
                    <div className="pt-12 flex justify-center gap-8">
                      <div 
                        style={{ backgroundColor: formData.primaryColor, borderRadius: formData.borderRadius }} 
                        className="h-24 px-16 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl cursor-pointer hover:scale-105 transition-all"
                        onClick={() => handleFieldClick('btnHeroStart', 'نص زر البداية')}
                      >
                        {formData.btnHeroStart}
                      </div>
                      <div 
                        className="h-24 px-16 rounded-[2.5rem] border-4 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-3xl text-white cursor-pointer hover:bg-white/20 transition-all"
                        style={{ borderRadius: formData.borderRadius }}
                        onClick={() => handleFieldClick('btnHeroLearn', 'نص زر المعرفة')}
                      >
                        {formData.btnHeroLearn}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {currentPage === 'dashboards' && (
                <section className="p-12 space-y-20">
                  {/* Student View Simulation */}
                  <div className="space-y-8">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-r-4 border-primary pr-3">معاينة لوحة المستفهم</h3>
                    <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 border-primary/5 hover:border-primary/20 transition-all">
                      <div className="space-y-4 text-right">
                        <h2 
                          className="text-4xl font-black text-zinc-800 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFieldClick('studentDashboardTitle', 'عنوان لوحة المستفهم')}
                        >
                          {formData.studentDashboardTitle}
                        </h2>
                        <Button 
                          size="lg" 
                          className="h-16 px-10 text-xl font-black rounded-2xl"
                          onClick={() => handleFieldClick('studentDashboardBtn', 'نص زر طلب استفهام')}
                        >
                          {formData.studentDashboardBtn}
                        </Button>
                      </div>
                      <BookOpen size={100} className="text-primary opacity-20" />
                    </div>
                  </div>

                  {/* Teacher View Simulation */}
                  <div className="space-y-8">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-r-4 border-accent pr-3">معاينة لوحة المفهم</h3>
                    <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-2 border-accent/5 hover:border-accent/20 transition-all">
                      <div className="space-y-4 text-right">
                        <h2 
                          className="text-4xl font-black text-zinc-800 cursor-pointer hover:text-accent transition-colors"
                          onClick={() => handleFieldClick('teacherDashboardTitle', 'عنوان لوحة المفهم')}
                        >
                          {formData.teacherDashboardTitle}
                        </h2>
                        <p 
                          className="text-muted-foreground font-bold text-lg max-w-xl cursor-pointer hover:text-zinc-900"
                          onClick={() => handleFieldClick('teacherDashboardSubtitle', 'وصف لوحة المفهم')}
                        >
                          {formData.teacherDashboardSubtitle}
                        </p>
                        <Button 
                          size="lg" 
                          className="h-16 px-10 text-xl font-black rounded-2xl bg-accent hover:bg-accent/90"
                          onClick={() => handleFieldClick('teacherDashboardBtn', 'نص زر إضافة عمل')}
                        >
                          {formData.teacherDashboardBtn} <Plus className="mr-2" />
                        </Button>
                      </div>
                      <ImageIcon size={100} className="text-accent opacity-20" />
                    </div>
                  </div>

                  {/* Create Request Modal Simulation */}
                  <div className="space-y-8 pt-10 border-t">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest text-center">معاينة نموذج إنشاء طلب (Modal)</h3>
                    <div className="max-w-2xl mx-auto bg-white border-4 border-zinc-100 rounded-[3rem] shadow-2xl p-10 space-y-8">
                      <h4 
                        className="text-3xl font-black text-center cursor-pointer hover:text-primary"
                        onClick={() => handleFieldClick('createIstifhamTitle', 'عنوان نافذة الطلب')}
                      >
                        {formData.createIstifhamTitle}
                      </h4>
                      <div className="space-y-4">
                        <div className="h-14 bg-zinc-50 rounded-2xl border-2 border-dashed"></div>
                        <div className="h-32 bg-zinc-50 rounded-2xl border-2 border-dashed"></div>
                        <div className="h-24 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20"></div>
                      </div>
                      <Button 
                        className="w-full h-16 text-xl font-black rounded-2xl shadow-xl"
                        onClick={() => handleFieldClick('createIstifhamBtn', 'نص زر إرسال الطلب')}
                      >
                        {formData.createIstifhamBtn}
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              {currentPage === 'teachers_list' && (
                <section className="p-12 space-y-12">
                  <div className="text-center space-y-8 max-w-3xl mx-auto">
                    <h1 
                      className="text-5xl font-black tracking-tight text-zinc-800 cursor-pointer hover:text-primary transition-all"
                      onClick={() => handleFieldClick('teachersListTitle', 'عنوان صفحة المدرسين')}
                    >
                      {formData.teachersListTitle}
                    </h1>
                    <div 
                      className="relative max-w-xl mx-auto h-16 bg-white rounded-2xl border-2 shadow-sm flex items-center px-6 text-zinc-400 font-bold cursor-pointer hover:border-primary"
                      onClick={() => handleFieldClick('teachersListSearchPlaceholder', 'نص البحث عن مدرس')}
                    >
                      <Search className="ml-4 h-5 w-5" />
                      {formData.teachersListSearchPlaceholder}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                      <Card key={i} className="rounded-xl p-6 bg-white text-center space-y-4 opacity-50 grayscale">
                        <Avatar className="h-20 w-20 mx-auto border-2"><AvatarFallback>خ</AvatarFallback></Avatar>
                        <div className="h-4 w-24 bg-zinc-100 mx-auto rounded"></div>
                        <div className="h-10 w-full bg-blue-500 rounded-lg"></div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {currentPage === 'portfolio_list' && (
                <section className="p-12 space-y-12">
                  <div className="space-y-4 border-r-8 border-primary pr-6">
                    <h1 
                      className="text-4xl font-black text-zinc-900 cursor-pointer hover:text-primary transition-all"
                      onClick={() => handleFieldClick('portfolioListTitle', 'عنوان معرض الأعمال')}
                    >
                      {formData.portfolioListTitle}
                    </h1>
                    <p 
                      className="text-muted-foreground font-bold text-xl cursor-pointer hover:text-zinc-900"
                      onClick={() => handleFieldClick('portfolioListSubtitle', 'وصف معرض الأعمال')}
                    >
                      {formData.portfolioListSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    {[1,2].map(i => (
                      <div key={i} className="space-y-4 opacity-40">
                        <div className="aspect-video bg-zinc-200 rounded-[2rem]"></div>
                        <div className="h-6 w-48 bg-zinc-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {currentPage === 'about' && (
                <section className="py-32 px-16 space-y-20">
                  <div className="flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 space-y-8 text-right">
                      <div 
                        className="bg-primary/10 w-24 h-24 flex items-center justify-center text-primary shadow-inner mb-6"
                        style={{ borderRadius: `calc(${formData.borderRadius} / 1.5)` }}
                      >
                        <Info size={48} />
                      </div>
                      <h2 
                        className="text-6xl font-black cursor-pointer hover:text-primary transition-all leading-tight"
                        onClick={() => handleFieldClick('aboutTitle', 'عنوان صفحة عن المنصة')}
                      >
                        {formData.aboutTitle}
                      </h2>
                      <p 
                        className="text-2xl leading-relaxed font-bold text-zinc-600 cursor-pointer hover:bg-black/5 p-8 border-r-8 border-primary transition-all"
                        onClick={() => handleFieldClick('aboutDescription', 'محتوى صفحة عن المنصة', 'textarea')}
                      >
                        {formData.aboutDescription}
                      </p>
                    </div>
                    <div className="flex-1 w-full aspect-square relative group">
                      <img 
                        src={formData.aboutImage || "https://placehold.co/600x600?text=About+Fahimni"} 
                        className="w-full h-full object-cover shadow-2xl cursor-pointer group-hover:scale-[1.02] transition-all"
                        style={{ borderRadius: formData.borderRadius }}
                        onClick={() => handleFieldClick('aboutImage', 'صورة صفحة عن المنصة', 'image')}
                      />
                    </div>
                  </div>
                </section>
              )}

              {currentPage === 'sidebar' && (
                <section className="py-20 px-16 flex justify-center bg-zinc-50">
                  <Card className="w-80 border-2 shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <div className="p-8 border-b flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl">ف</div>
                      <span className="font-black text-2xl text-primary">{formData.siteTitle}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <SidebarItem icon={Home} label={formData.sideHome} onClick={() => handleFieldClick('sideHome', 'زر الرئيسية')} />
                      <SidebarItem icon={GraduationCap} label={formData.sideTeachers} onClick={() => handleFieldClick('sideTeachers', 'زر المفهمين')} />
                      <SidebarItem icon={ImageIcon} label={formData.sidePortfolio} onClick={() => handleFieldClick('sidePortfolio', 'زر أعمال المفهمين')} />
                      <SidebarItem icon={ClipboardList} label={formData.sideRequests} onClick={() => handleFieldClick('sideRequests', 'زر استفهاماتي')} />
                      <SidebarItem icon={Wallet} label={formData.sideWallet} onClick={() => handleFieldClick('sideWallet', 'زر المحفظة')} />
                      <SidebarItem icon={Settings} label={formData.sideSettings} onClick={() => handleFieldClick('sideSettings', 'زر الإعدادات')} />
                      <div className="pt-4 border-t mt-4">
                        <SidebarItem icon={LayoutDashboard} label={formData.sideAdmin} onClick={() => handleFieldClick('sideAdmin', 'عنوان لوحة المسؤول')} color="text-accent" />
                      </div>
                      <div className="pt-4 space-y-2">
                        <div 
                          className="p-3 bg-primary/5 rounded-xl border-2 border-dashed border-primary/20 text-center cursor-pointer hover:bg-primary/10"
                          onClick={() => handleFieldClick('sideToggleToTeacher', 'نص زر تبديل الدور')}
                        >
                          <span className="text-[10px] font-black text-primary">{formData.sideToggleToTeacher}</span>
                        </div>
                        <SidebarItem icon={LogOut} label={formData.sideLogout} onClick={() => handleFieldClick('sideLogout', 'زر الخروج')} color="text-red-500" />
                      </div>
                    </div>
                  </Card>
                </section>
              )}

              {currentPage === 'nav' && (
                <section className="py-32 px-16 space-y-12">
                  <h2 className="text-4xl font-black text-center mb-12">تعديل نصوص إضافية</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <NavItemEdit label="الرابط الأول (الهيدر)" value={formData.navHome} onClick={()=>handleFieldClick('navHome', 'الرابط الأول')} />
                    <NavItemEdit label="الرابط الثاني (الهيدر)" value={formData.navAbout} onClick={()=>handleFieldClick('navAbout', 'الرابط الثاني')} />
                    <NavItemEdit label="الرابط الثالث (الهيدر)" value={formData.navGuide} onClick={()=>handleFieldClick('navGuide', 'الرابط الثالث')} />
                    <NavItemEdit label="الرابط الرابع (الهيدر)" value={formData.navGuarantees} onClick={()=>handleFieldClick('navGuarantees', 'الرابط الرابع')} />
                    <NavItemEdit label="نص التذييل" value={formData.footerText} onClick={()=>handleFieldClick('footerText', 'حقوق الملكية')} />
                  </div>
                </section>
              )}
            </div>

            {/* Footer Preview */}
            <footer className="mt-20 py-16 border-t px-12 flex flex-col md:flex-row justify-between items-center bg-zinc-900 text-white rounded-t-[5rem]">
              <div className="flex items-center gap-4">
                <div style={{ backgroundColor: formData.primaryColor }} className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white">ف</div>
                <div 
                  className="text-xl font-black opacity-60 cursor-pointer hover:bg-white/10 p-3 rounded-xl transition-all"
                  onClick={() => handleFieldClick('footerText', 'نص حقوق الملكية')}
                >
                  {formData.footerText}
                </div>
              </div>
              <div className="flex gap-6 opacity-20">
                <div className="w-10 h-10 rounded-full bg-white"></div>
                <div className="w-10 h-10 rounded-full bg-white"></div>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Editor Dialog */}
      <Dialog open={!!activeField && activeField.type !== 'image'} onOpenChange={() => setActiveField(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-[3.5rem] border-none shadow-2xl p-12" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-4xl font-black flex items-center gap-4">
              <Edit3 className="text-primary h-10 w-10" /> تعديل المحتوى
            </DialogTitle>
            <DialogDescription className="text-right text-xl font-bold mt-2">
              تعديل: <span className="text-primary">{activeField?.label}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-10">
            <Label className="font-black mb-4 block text-lg text-right">القيمة الجديدة</Label>
            {activeField?.type === 'textarea' ? (
              <Textarea 
                value={activeField?.value || ""} 
                onChange={(e) => setActiveField({...activeField!, value: e.target.value})}
                className="h-60 rounded-3xl border-4 border-zinc-100 text-2xl font-medium p-8 focus:border-primary transition-all leading-relaxed text-right"
              />
            ) : (
              <Input 
                value={activeField?.value || ""} 
                onChange={(e) => setActiveField({...activeField!, value: e.target.value})}
                className="h-20 rounded-2xl border-4 border-zinc-100 text-3xl font-black px-6 focus:border-primary transition-all text-right"
              />
            )}
          </div>
          <div className="flex gap-6">
            <Button onClick={updateField} className="flex-1 h-20 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-[1.02] transition-all">
              تحديث المعاينة
            </Button>
            <Button variant="ghost" onClick={() => setActiveField(null)} className="h-20 px-10 rounded-[2rem] font-black text-xl text-zinc-400">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-black opacity-60 pr-2">{label}</Label>
      <div className="flex gap-3">
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 shadow-inner group">
          <input 
            type="color" 
            value={value || "#000000"} 
            onChange={(e) => onChange(e.target.value)} 
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10" 
          />
          <div style={{ backgroundColor: value || "#000000" }} className="w-full h-full"></div>
        </div>
        <Input 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-14 font-mono font-bold text-lg flex-1 rounded-2xl border-2" 
        />
      </div>
    </div>
  );
}

function ImageThumb({ label, value, onClick }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black opacity-60">{label}</Label>
      <div 
        onClick={onClick}
        className="h-24 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary transition-all"
      >
        {value ? (
          <img src={value} className="w-full h-full object-contain p-2" />
        ) : (
          <ImageIcon size={24} className="text-zinc-300" />
        )}
      </div>
    </div>
  );
}

function NavItemEdit({ label, value, onClick }: any) {
  return (
    <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-3">
      <Label className="font-black text-zinc-400 text-xs">{label}</Label>
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <span className="font-black text-zinc-800">{value}</span>
        <Button size="sm" variant="ghost" onClick={onClick} className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10">
          <Edit3 size={16} />
        </Button>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, onClick, color }: any) {
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:bg-muted transition-all group"
      onClick={onClick}
    >
      <Icon size={20} className={color || "text-primary"} />
      <span className={`font-black text-sm ${color || "text-zinc-700"}`}>{label}</span>
      <Edit3 size={12} className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-300" />
    </div>
  );
}
