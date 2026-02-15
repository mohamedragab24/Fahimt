
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
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
  Monitor, 
  MousePointer2,
  FileText,
  ShieldCheck,
  Info,
  BookOpen,
  Layout,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PageType = 'home' | 'about' | 'terms' | 'privacy' | 'guarantees' | 'guide';

export default function ManualEditorPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<{key: string, label: string, value: string} | null>(null);
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
    // About Page
    aboutTitle: "ما هي منصة فهمني؟",
    aboutDescription: "فهمني هي المنصة العربية الأولى المتخصصة في طلب وتقديم خدمات الشرح الفوري التفاعلي لأغلب التخصصات الأكاديمية والتقنية والمهارية.",
    // Terms Page
    termsTitle: "شروط الاستخدام",
    termsDescription: "استخدامك لـ 'فهمني' يعني موافقتك الكاملة وغير المشروطة على هذه الشروط المنظمة للعلاقة بيننا.",
    // Privacy Page
    privacyTitle: "سياسة الخصوصية",
    privacyDescription: "كيف تتعامل منصة 'فهمني' مع بياناتك؟ نحن نلتزم بحماية خصوصيتك وتأمين بياناتك.",
    // Guarantees Page
    guaranteesTitle: "ضمان الحقوق",
    guaranteesDescription: "نحن في 'فهمني' نلعب دور الوسيط الضامن لتجربة عادلة ومرضية، حيث تبقى حقوقك المالية والمعرفية في أمان تام.",
    // Guide Page
    guideTitle: "الدليل الإرشادي",
    guideSubtitle: "الدليل الشامل لمستخدمي منصة 'فهمني' لضمان تجربة تعليمية مثمرة وسلسة للطرفين."
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...formData,
        ...settings
      });
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
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث كافة صفحات المنصة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ التغييرات." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldClick = (key: string, label: string) => {
    setActiveField({ key, label, value: (formData as any)[key] });
  };

  const updateField = () => {
    if (activeField) {
      setFormData({ ...formData, [activeField.key]: activeField.value });
      setActiveField(null);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل المحرر المرئي الشامل...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-100" dir="rtl">
      {/* Header Toolbar */}
      <header className="h-24 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Layers size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black">المحرر المرئي الشامل</h1>
            <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
              <MousePointer2 size={12} /> اختر الصفحة ثم اضغط على أي نص لتعديله
            </p>
          </div>
        </div>

        <Tabs value={currentPage} onValueChange={(v) => setCurrentPage(v as PageType)} className="w-auto">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-14">
            <TabsTrigger value="home" className="rounded-lg font-bold px-4">الرئيسية</TabsTrigger>
            <TabsTrigger value="about" className="rounded-lg font-bold px-4">عن المنصة</TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg font-bold px-4">الدليل</TabsTrigger>
            <TabsTrigger value="guarantees" className="rounded-lg font-bold px-4">الضمانات</TabsTrigger>
            <TabsTrigger value="terms" className="rounded-lg font-bold px-4">الشروط</TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg font-bold px-4">الخصوصية</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving} className="h-14 px-10 rounded-2xl font-black text-xl shadow-xl">
            {isSaving ? <RefreshCw className="animate-spin ml-2" /> : <Save className="ml-2" />}
            حفظ الكل
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 bg-white border-l overflow-y-auto p-6 space-y-8 shrink-0 shadow-xl z-40">
          <div className="space-y-4">
            <h3 className="font-black text-sm text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> ألوان المنصة
            </h3>
            <div className="space-y-6">
              <ColorInput label="اللون الأساسي" value={formData.primaryColor} onChange={(v) => setFormData({...formData, primaryColor: v})} />
              <ColorInput label="لون التمييز" value={formData.accentColor} onChange={(v) => setFormData({...formData, accentColor: v})} />
              <ColorInput label="لون الخلفية" value={formData.backgroundColor} onChange={(v) => setFormData({...formData, backgroundColor: v})} />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-black text-sm text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> نصوص ثابتة
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold opacity-60">اسم الموقع</Label>
                <Input value={formData.siteTitle} onChange={(e)=>setFormData({...formData, siteTitle: e.target.value})} className="h-10 rounded-lg text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold opacity-60">نص التذييل</Label>
                <Input value={formData.footerText} onChange={(e)=>setFormData({...formData, footerText: e.target.value})} className="h-10 rounded-lg text-sm font-bold" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-100 mt-6">
            <p className="text-xs font-bold text-blue-700 leading-relaxed">
              <Sparkles size={14} className="inline ml-1" /> أي تعديل تجريه هنا سيتم حفظه في كافة صفحات الموقع فور الضغط على زر الحفظ العلوي.
            </p>
          </div>
        </aside>

        {/* Live Preview Area */}
        <main className="flex-1 bg-zinc-200/50 p-10 overflow-y-auto flex flex-col items-center">
          <div 
            className="w-full max-w-5xl bg-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden min-h-[1500px] transition-all duration-700 border-8 border-white"
            style={{ backgroundColor: formData.backgroundColor }}
          >
            {/* Nav Preview */}
            <nav className="h-24 border-b flex items-center justify-between px-12 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div style={{ backgroundColor: formData.primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">ف</div>
                <span 
                  className="font-black text-3xl cursor-pointer hover:bg-primary/5 px-3 py-1 rounded-xl transition-all"
                  style={{ color: formData.primaryColor }}
                  onClick={() => handleFieldClick('siteTitle', 'اسم المنصة')}
                >
                  {formData.siteTitle}
                </span>
              </div>
              <div className="flex gap-6 opacity-30">
                <div className="w-24 h-3 bg-zinc-200 rounded-full"></div>
                <div className="w-24 h-3 bg-zinc-200 rounded-full"></div>
              </div>
            </nav>

            {/* Dynamic Page Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {currentPage === 'home' && (
                <section className="py-40 px-12 text-center space-y-12 relative">
                  <div className="absolute inset-0 opacity-5 -z-10" style={{ backgroundColor: formData.primaryColor }}></div>
                  <h1 
                    className="text-7xl md:text-8xl font-black leading-tight cursor-pointer hover:bg-black/5 p-6 rounded-[3rem] transition-all"
                    onClick={() => handleFieldClick('heroTitle', 'عنوان الهيرو')}
                  >
                    {formData.heroTitle}
                  </h1>
                  <p 
                    className="text-3xl font-bold opacity-60 max-w-3xl mx-auto cursor-pointer hover:bg-black/5 p-4 rounded-2xl transition-all"
                    onClick={() => handleFieldClick('heroSubtitle', 'الوصف الفرعي')}
                  >
                    {formData.heroSubtitle}
                  </p>
                  <div className="pt-12 flex justify-center gap-8">
                    <div style={{ backgroundColor: formData.primaryColor }} className="h-24 px-16 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl">ابدأ الآن</div>
                    <div className="h-24 px-16 rounded-[2.5rem] border-4 border-zinc-100 flex items-center justify-center font-black text-3xl">عن المنصة</div>
                  </div>
                </section>
              )}

              {currentPage === 'about' && (
                <section className="py-32 px-16 space-y-12">
                  <div className="text-center space-y-6">
                    <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
                      <Info size={48} />
                    </div>
                    <h2 
                      className="text-6xl font-black cursor-pointer hover:bg-primary/5 p-4 rounded-2xl transition-all inline-block"
                      onClick={() => handleFieldClick('aboutTitle', 'عنوان صفحة عن المنصة')}
                    >
                      {formData.aboutTitle}
                    </h2>
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <p 
                      className="text-2xl leading-relaxed font-bold text-zinc-600 text-center cursor-pointer hover:bg-black/5 p-8 rounded-[3rem] transition-all bg-zinc-50 border-2 border-dashed"
                      onClick={() => handleFieldClick('aboutDescription', 'محتوى عن المنصة')}
                    >
                      {formData.aboutDescription}
                    </p>
                  </div>
                </section>
              )}

              {currentPage === 'guide' && (
                <section className="py-32 px-16 space-y-12">
                  <div className="text-center space-y-6">
                    <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
                      <BookOpen size={48} />
                    </div>
                    <h2 
                      className="text-6xl font-black cursor-pointer hover:bg-primary/5 p-4 rounded-2xl transition-all inline-block"
                      onClick={() => handleFieldClick('guideTitle', 'عنوان الدليل')}
                    >
                      {formData.guideTitle}
                    </h2>
                    <p 
                      className="text-2xl font-bold opacity-60 max-w-2xl mx-auto cursor-pointer hover:bg-black/5 p-2 rounded-xl transition-all"
                      onClick={() => handleFieldClick('guideSubtitle', 'وصف الدليل')}
                    >
                      {formData.guideSubtitle}
                    </p>
                  </div>
                </section>
              )}

              {currentPage === 'guarantees' && (
                <section className="py-32 px-16 space-y-12">
                  <div className="text-center space-y-6">
                    <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
                      <ShieldCheck size={48} />
                    </div>
                    <h2 
                      className="text-6xl font-black cursor-pointer hover:bg-primary/5 p-4 rounded-2xl transition-all inline-block"
                      onClick={() => handleFieldClick('guaranteesTitle', 'عنوان صفحة الضمانات')}
                    >
                      {formData.guaranteesTitle}
                    </h2>
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <p 
                      className="text-2xl leading-relaxed font-bold text-zinc-600 text-center cursor-pointer hover:bg-black/5 p-8 rounded-[3rem] transition-all bg-zinc-50 border-2 border-dashed"
                      onClick={() => handleFieldClick('guaranteesDescription', 'محتوى الضمانات')}
                    >
                      {formData.guaranteesDescription}
                    </p>
                  </div>
                </section>
              )}

              {currentPage === 'terms' && (
                <section className="py-32 px-16 space-y-12">
                  <div className="text-center space-y-6">
                    <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
                      <FileText size={48} />
                    </div>
                    <h2 
                      className="text-6xl font-black cursor-pointer hover:bg-primary/5 p-4 rounded-2xl transition-all inline-block"
                      onClick={() => handleFieldClick('termsTitle', 'عنوان شروط الاستخدام')}
                    >
                      {formData.termsTitle}
                    </h2>
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <p 
                      className="text-2xl leading-relaxed font-bold text-zinc-600 text-center cursor-pointer hover:bg-black/5 p-8 rounded-[3rem] transition-all bg-zinc-50 border-2 border-dashed"
                      onClick={() => handleFieldClick('termsDescription', 'محتوى الشروط')}
                    >
                      {formData.termsDescription}
                    </p>
                  </div>
                </section>
              )}

              {currentPage === 'privacy' && (
                <section className="py-32 px-16 space-y-12">
                  <div className="text-center space-y-6">
                    <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
                      <ShieldCheck size={48} />
                    </div>
                    <h2 
                      className="text-6xl font-black cursor-pointer hover:bg-primary/5 p-4 rounded-2xl transition-all inline-block"
                      onClick={() => handleFieldClick('privacyTitle', 'عنوان سياسة الخصوصية')}
                    >
                      {formData.privacyTitle}
                    </h2>
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <p 
                      className="text-2xl leading-relaxed font-bold text-zinc-600 text-center cursor-pointer hover:bg-black/5 p-8 rounded-[3rem] transition-all bg-zinc-50 border-2 border-dashed"
                      onClick={() => handleFieldClick('privacyDescription', 'محتوى الخصوصية')}
                    >
                      {formData.privacyDescription}
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Footer Preview */}
            <footer className="mt-20 py-16 border-t px-12 flex flex-col md:flex-row justify-between items-center bg-zinc-900 text-white rounded-t-[5rem]">
              <div 
                className="text-xl font-black opacity-60 cursor-pointer hover:bg-white/10 p-3 rounded-xl transition-all"
                onClick={() => handleFieldClick('footerText', 'نص التذييل')}
              >
                {formData.footerText}
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
      <Dialog open={!!activeField} onOpenChange={() => setActiveField(null)}>
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
            <Label className="font-black mb-4 block text-lg">النص الجديد</Label>
            {activeField?.key.toLowerCase().includes('description') || activeField?.key.toLowerCase().includes('content') || activeField?.key.toLowerCase().includes('subtitle') ? (
              <Textarea 
                value={activeField?.value} 
                onChange={(e) => setActiveField({...activeField!, value: e.target.value})}
                className="h-60 rounded-3xl border-4 border-zinc-100 text-2xl font-medium p-8 focus:border-primary transition-all leading-relaxed"
              />
            ) : (
              <Input 
                value={activeField?.value} 
                onChange={(e) => setActiveField({...activeField!, value: e.target.value})}
                className="h-20 rounded-2xl border-4 border-zinc-100 text-3xl font-black px-6 focus:border-primary transition-all"
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
      <Label className="text-sm font-black opacity-60 pr-2">{label}</Label>
      <div className="flex gap-3">
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden border-2 shadow-inner group">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" 
          />
          <div style={{ backgroundColor: value }} className="w-full h-full"></div>
        </div>
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-14 font-mono font-bold text-lg flex-1 rounded-2xl border-2" 
        />
      </div>
    </div>
  );
}
