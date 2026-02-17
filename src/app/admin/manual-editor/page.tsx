
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
  ChevronLeft,
  Gavel,
  Lock,
  Target,
  Users,
  Video,
  Star,
  Search,
  Plus,
  Share2,
  Globe,
  SearchCode,
  Zap,
  Code2,
  MessageSquare,
  Youtube,
  Layout
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type PageType = 'home' | 'about' | 'terms' | 'privacy' | 'guarantees' | 'guide' | 'nav' | 'sidebar' | 'dashboards' | 'teachers_list' | 'portfolio_list' | 'seo';

export default function ManualEditorPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);
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
    // SEO Settings
    metaTitle: "فهمني - منصة التعلم الذكي",
    metaDescription: "أول منصة عربية لخدمات الشرح الفوري والربط بين المفهمين والمستفهمين لتبادل الخبرات والمعرفة.",
    metaKeywords: "تعلم, شرح فوري, دروس خصوصية, تعليم اونلاين, مفهم, مستفهم",
    googleSiteVerification: "",
    ogImageUrl: "",
    // Images
    logoUrl: "",
    landingBg: "",
    aboutImage: "",
    // Video
    landingVideoId: "dQw4w9WgXcQ", 
    // Nav Labels
    navHome: "الرئيسية",
    navAbout: "عن المنصة",
    navGuide: "الدليل",
    navGuarantees: "الضمانات",
    navTeachers: "المُفهمين",
    navPortfolio: "أعمال المفهمين",
    navBrowse: "تصفح الاستفهامات",
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
    // Dashboards
    studentDashboardTitle: "عندك سؤال؟ اطرح استفهامك الآن",
    studentDashboardBtn: "طلب استفهام جديد",
    teacherDashboardTitle: "اعرض مهاراتك.. أضف عملاً جديداً لمعرضك",
    teacherDashboardSubtitle: "كلما زادت أعمالك المميزة في المعرض, زادت ثقة الطلاب باختيارك لمشاريعهم.",
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
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث كافة تفاصيل المنصة وتجهيز إعدادات SEO." });
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

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
      const scrollAmount = 250;
      tabsListRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل المحرر الفائق...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-100 font-body" dir="rtl">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      
      <header className="h-24 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <LayoutTemplate size={32} />
          </div>
          <div className="hidden md:block">
            <h1 className="text-2xl font-black">المحرر الفائق و SEO</h1>
            <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
              <Zap size={12} className="text-accent" /> تحكم كامل في الظهور والبحث
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-[60%] flex items-center gap-2 px-4">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-full h-10 w-10 text-zinc-400" onClick={() => scrollTabs('right')}>
            <ChevronRight size={24} />
          </Button>

          <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as PageType)} className="flex-1 overflow-hidden">
            <div ref={tabsListRef} className="overflow-x-auto no-scrollbar flex items-center">
              <TabsList className="bg-muted/50 p-1 rounded-xl h-14 flex-nowrap shrink-0">
                <TabsTrigger value="home" className="rounded-lg font-black px-4 shrink-0">الرئيسية</TabsTrigger>
                <TabsTrigger value="dashboards" className="rounded-lg font-black px-4 shrink-0">لوحات التحكم</TabsTrigger>
                <TabsTrigger value="seo" className="rounded-lg font-black px-4 shrink-0 flex items-center gap-2">إعدادات البحث <Share2 size={14}/></TabsTrigger>
                <TabsTrigger value="teachers_list" className="rounded-lg font-black px-4 shrink-0">المدرسين</TabsTrigger>
                <TabsTrigger value="portfolio_list" className="rounded-lg font-black px-4 shrink-0">معرض الأعمال</TabsTrigger>
                <TabsTrigger value="nav" className="rounded-lg font-black px-4 shrink-0">الهيدر والفوتر</TabsTrigger>
                <TabsTrigger value="sidebar" className="rounded-lg font-black px-4 shrink-0">القائمة الجانبية</TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg font-black px-4 shrink-0">عن المنصة</TabsTrigger>
                <TabsTrigger value="terms" className="rounded-lg font-black px-4 shrink-0">الشروط</TabsTrigger>
                <TabsTrigger value="privacy" className="rounded-lg font-black px-4 shrink-0">الخصوصية</TabsTrigger>
                <TabsTrigger value="guarantees" className="rounded-lg font-black px-4 shrink-0">الضمانات</TabsTrigger>
                <TabsTrigger value="guide" className="rounded-lg font-black px-4 shrink-0">الدليل</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <Button variant="ghost" size="icon" className="shrink-0 rounded-full h-10 w-10 text-zinc-400" onClick={() => scrollTabs('left')}>
            <ChevronLeft size={24} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving} className="h-14 px-10 rounded-2xl font-black text-xl shadow-xl">
            {isSaving ? <RefreshCw className="animate-spin ml-2" /> : <Save className="ml-2" />}
            حفظ الإعدادات
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-l overflow-y-auto p-6 space-y-8 shrink-0 shadow-xl z-40">
          <div className="space-y-4">
            <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> الهوية والتصميم
            </h3>
            <div className="space-y-6">
              <ColorInput label="اللون الأساسي" value={formData.primaryColor || ""} onChange={(v) => setFormData({...formData, primaryColor: v})} />
              <ColorInput label="لون التمييز" value={formData.accentColor || ""} onChange={(v) => setFormData({...formData, accentColor: v})} />
              <div className="space-y-2">
                <Label className="text-[10px] font-black opacity-60">نصف قطر الزوايا</Label>
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
              <ImageIcon size={14} /> الأصول الرسومية
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageThumb label="اللوجو الرئيسي" value={formData.logoUrl} onClick={() => handleFieldClick('logoUrl', 'شعار المنصة', 'image')} />
              <ImageThumb label="خلفية الهيرو" value={formData.landingBg} onClick={() => handleFieldClick('landingBg', 'خلفية صفحة الهبوط', 'image')} />
              <ImageThumb label="صورة المشاركة" value={formData.ogImageUrl} onClick={() => handleFieldClick('ogImageUrl', 'صورة معاينة الروابط', 'image')} />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Youtube size={14} /> فيديو الشرح
            </h3>
            <div className="space-y-2">
              <Label className="text-[10px] font-black opacity-60">معرف فيديو يوتيوب (Video ID)</Label>
              <Input 
                placeholder="مثال: dQw4w9WgXcQ" 
                value={formData.landingVideoId} 
                onChange={(e) => setFormData({...formData, landingVideoId: e.target.value})}
                className="h-10 rounded-lg border-2 font-mono text-xs"
              />
              <p className="text-[8px] text-muted-foreground">استخرج المعرف من نهاية رابط الفيديو في يوتيوب.</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-zinc-200/50 p-10 overflow-y-auto flex flex-col items-center">
          <div 
            className="w-full max-w-5xl bg-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden min-h-[1200px] transition-all duration-700"
            style={{ 
              backgroundColor: formData.backgroundColor || "#FFFFFF",
              borderRadius: formData.borderRadius 
            }}
          >
            {/* Header Preview */}
            <nav className="h-24 border-b flex items-center justify-between px-12 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div 
                  style={{ backgroundColor: formData.primaryColor, borderRadius: `calc(${formData.borderRadius} / 2)` }} 
                  className="w-12 h-12 flex items-center justify-center text-white font-black text-2xl shadow-lg cursor-pointer overflow-hidden"
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
              <div className="flex gap-6 items-center">
                {['navHome', 'navTeachers', 'navPortfolio', 'navBrowse'].map(key => (
                  <span 
                    key={key}
                    className="font-black text-xs text-zinc-400 cursor-pointer hover:text-primary whitespace-nowrap"
                    onClick={() => handleFieldClick(key, 'اسم رابط التنقل')}
                  >
                    {(formData as any)[key] || ""}
                  </span>
                ))}
              </div>
            </nav>

            {/* Page Previews */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {currentPage === 'home' && (
                <>
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

                      {/* Search Bar Simulation */}
                      <div className="max-w-3xl mx-auto flex gap-4 p-3 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20 mt-10">
                        <div className="flex-1 bg-white h-16 rounded-[2rem] flex items-center px-6 gap-4">
                          <Search size={24} className="text-zinc-300" />
                          <span className="text-zinc-400 font-bold">ابحث عن موضوع تعليمي...</span>
                        </div>
                        <Button className="h-16 px-10 rounded-[2rem] bg-accent font-black text-xl">استفهم الآن</Button>
                      </div>
                    </div>
                  </section>

                  {/* Video Preview Section */}
                  <section className="py-20 px-12 bg-zinc-50 flex flex-col items-center gap-10">
                    <div className="text-center space-y-4">
                      <h2 className="text-4xl font-black text-zinc-900">شرح منصة {formData.siteTitle}</h2>
                      <p className="text-muted-foreground font-bold">شاهد هذا الفيديو لتعرف كيف تبدأ رحلة الفهم معنا.</p>
                    </div>
                    <div className="w-full max-w-4xl aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white bg-black group relative">
                      <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${formData.landingVideoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                      <div className="absolute inset-0 bg-primary/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </section>
                </>
              )}

              {currentPage === 'seo' && (
                <section className="p-16 space-y-12">
                  <div className="space-y-4 border-r-8 border-accent pr-6">
                    <h2 className="text-4xl font-black text-zinc-900">معاينة المشاركة والبحث (SEO)</h2>
                    <p className="text-zinc-500 font-bold">تحكم في كيفية ظهور منصة <span className="text-primary">{formData.siteTitle}</span> عند مشاركة الرابط وفي جوجل.</p>
                  </div>

                  {/* WhatsApp Preview Simulation */}
                  <div className="max-w-md mx-auto bg-[#DCF8C6] rounded-3xl p-4 shadow-2xl relative">
                    <div className="absolute -right-2 top-4 w-4 h-4 bg-[#DCF8C6] rotate-45"></div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-200/50">
                      <div className="flex items-stretch bg-[#F0F2F5]/50">
                        <div 
                          className="w-24 shrink-0 bg-zinc-200 relative group cursor-pointer"
                          onClick={() => handleFieldClick('ogImageUrl', 'صورة المعاينة المصغرة', 'image')}
                        >
                          {formData.ogImageUrl ? (
                            <img src={formData.ogImageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-zinc-400">
                              <ImageIcon size={24} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white h-6 w-6" />
                          </div>
                        </div>
                        <div className="p-3 flex-1 text-right space-y-1">
                          <h4 
                            className="text-sm font-black text-[#075E54] cursor-pointer hover:underline"
                            onClick={() => handleFieldClick('metaTitle', 'عنوان الرابط')}
                          >
                            {formData.metaTitle}
                          </h4>
                          <p 
                            className="text-[10px] text-zinc-500 font-bold leading-tight cursor-pointer"
                            onClick={() => handleFieldClick('metaDescription', 'وصف الرابط', 'textarea')}
                          >
                            {formData.metaDescription}
                          </p>
                          <p className="text-[8px] text-[#34B7F1] font-mono mt-1">https://{formData.siteTitle.toLowerCase()}.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-2 items-center text-[10px] text-zinc-500 font-bold">
                      <span>٨:١٧ م</span>
                      <CheckCircle2 size={10} className="text-blue-500" />
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 text-blue-800 text-sm font-bold flex items-start gap-3">
                    <Info className="shrink-0 mt-1" size={18} />
                    <p>المحاكي أعلاه يوضح كيف سيظهر رابط موقعك عند إرساله في واتساب أو تليجرام. اضغط على أي نص أو على الصورة لتعديلها فوراً.</p>
                  </div>

                  {/* Advanced SEO Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <div className="p-8 bg-white rounded-3xl border shadow-sm space-y-6">
                      <h4 className="font-black text-xl flex items-center gap-2"><Globe className="text-primary"/> الأساسيات (Meta Tags)</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-black text-xs opacity-60">العنوان التعريفي (Title)</Label>
                          <Input value={formData.metaTitle} onChange={(e)=>setFormData({...formData, metaTitle: e.target.value})} className="h-12 rounded-xl border-2 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black text-xs opacity-60">الوصف التعريفي (Description)</Label>
                          <Textarea value={formData.metaDescription} onChange={(e)=>setFormData({...formData, metaDescription: e.target.value})} className="h-24 rounded-xl border-2 font-medium" />
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-zinc-900 rounded-3xl text-white space-y-6">
                      <h4 className="font-black text-xl flex items-center gap-2"><Code2 className="text-accent"/> تقنيات التصدر (Advanced)</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-black text-xs text-white/60">الكلمات المفتاحية (Keywords - مفصولة بفاصلة)</Label>
                          <Input value={formData.metaKeywords} onChange={(e)=>setFormData({...formData, metaKeywords: e.target.value})} className="h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black text-xs text-white/60">Google Search Console Verification ID</Label>
                          <Input placeholder="مثال: google-site-verification=..." value={formData.googleSiteVerification} onChange={(e)=>setFormData({...formData, googleSiteVerification: e.target.value})} className="h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white font-mono" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Other Pages Sim... */}
              {currentPage === 'about' && (
                <section className="p-16 space-y-12">
                  <h2 className="text-5xl font-black text-center" onClick={() => handleFieldClick('aboutTitle', 'عنوان صفحة عن المنصة')}>
                    {formData.aboutTitle}
                  </h2>
                  <p className="text-2xl text-zinc-600 leading-relaxed text-center max-w-4xl mx-auto" onClick={() => handleFieldClick('aboutDescription', 'وصف صفحة عن المنصة', 'textarea')}>
                    {formData.aboutDescription}
                  </p>
                </section>
              )}
            </div>

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
            </footer>
          </div>
        </main>
      </div>

      {/* Field Edit Dialog */}
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
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 shadow-inner">
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
