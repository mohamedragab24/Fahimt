
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Palette, 
  Type, 
  Layout, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Edit3, 
  Monitor, 
  Smartphone,
  Eye,
  CheckCircle2,
  X,
  MousePointer2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ManualEditorPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<{key: string, label: string, value: string} | null>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    siteTitle: "",
    heroTitle: "",
    heroSubtitle: "",
    footerText: "",
    primaryColor: "#29B6F6",
    accentColor: "#FF7043",
    backgroundColor: "#F8FAFC"
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || "فهمني",
        heroTitle: settings.heroTitle || "أول منصة عربية لخدمات الشرح الفوري",
        heroSubtitle: settings.heroSubtitle || "مُفهمين خبراء لخدمة كل مُستفهم طموح",
        footerText: settings.footerText || "جميع الحقوق محفوظة لمنصة فهمني",
        primaryColor: settings.primaryColor || "#29B6F6",
        accentColor: settings.accentColor || "#FF7043",
        backgroundColor: settings.backgroundColor || "#F8FAFC"
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
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث المنصة بالكامل." });
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

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل المحرر المرئي...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-100" dir="rtl">
      {/* Header Toolbar */}
      <header className="h-20 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Edit3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black">تحرير المنصة يدوي</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
              <MousePointer2 size={10} /> اضغط على أي كلمة للتعديل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-xl font-bold border-2">
            <Monitor size={18} className="ml-2" /> سطح المكتب
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8 rounded-xl font-black text-lg shadow-lg">
            {isSaving ? <RefreshCw className="animate-spin ml-2" /> : <Save className="ml-2" />}
            حفظ التغييرات
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 bg-white border-l overflow-y-auto p-6 space-y-8 shrink-0">
          <div className="space-y-4">
            <h3 className="font-black text-sm text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> الألوان والهوية
            </h3>
            <div className="space-y-6">
              <ColorInput label="اللون الأساسي" value={formData.primaryColor} onChange={(v) => setFormData({...formData, primaryColor: v})} />
              <ColorInput label="لون التمييز" value={formData.accentColor} onChange={(v) => setFormData({...formData, accentColor: v})} />
              <ColorInput label="لون الخلفية" value={formData.backgroundColor} onChange={(v) => setFormData({...formData, backgroundColor: v})} />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-black text-sm text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> النصوص العامة
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold opacity-60">اسم المنصة</Label>
                <Input value={formData.siteTitle} onChange={(e)=>setFormData({...formData, siteTitle: e.target.value})} className="h-10 rounded-lg text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold opacity-60">نص التذييل</Label>
                <Input value={formData.footerText} onChange={(e)=>setFormData({...formData, footerText: e.target.value})} className="h-10 rounded-lg text-sm font-bold" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mt-6">
            <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
              <Sparkles size={12} className="inline ml-1" /> أي تغيير تقوم به هنا سيظهر في المعاينة على اليسار فوراً. اضغط على حفظ لجعلها عامة.
            </p>
          </div>
        </aside>

        {/* Live Preview Area */}
        <main className="flex-1 bg-zinc-200/50 p-8 overflow-y-auto flex flex-col items-center">
          <div 
            className="w-full max-w-5xl bg-white shadow-2xl rounded-[3rem] overflow-hidden min-h-[1200px] transition-all duration-500"
            style={{ backgroundColor: formData.backgroundColor }}
          >
            {/* Nav Preview */}
            <nav className="h-20 border-b flex items-center justify-between px-10 bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: formData.primaryColor }} className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">ف</div>
                <span 
                  className="font-black text-2xl cursor-pointer hover:bg-primary/5 px-2 rounded-lg transition-colors"
                  style={{ color: formData.primaryColor }}
                  onClick={() => handleFieldClick('siteTitle', 'اسم المنصة')}
                >
                  {formData.siteTitle}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-2 bg-zinc-100 rounded-full"></div>
                <div className="w-20 h-2 bg-zinc-100 rounded-full"></div>
              </div>
            </nav>

            {/* Hero Preview */}
            <section className="py-32 px-10 text-center space-y-10 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-5 -z-10"
                style={{ backgroundColor: formData.primaryColor }}
              ></div>
              
              <div className="max-w-4xl mx-auto space-y-6">
                <h1 
                  className="text-6xl md:text-7xl font-black leading-tight cursor-pointer hover:bg-black/5 p-4 rounded-3xl transition-all"
                  style={{ color: '#18181b' }}
                  onClick={() => handleFieldClick('heroTitle', 'عنوان الهيرو')}
                >
                  {formData.heroTitle}
                </h1>
                
                <p 
                  className="text-2xl font-bold opacity-60 max-w-2xl mx-auto cursor-pointer hover:bg-black/5 p-2 rounded-xl transition-all"
                  onClick={() => handleFieldClick('heroSubtitle', 'الوصف الفرعي')}
                >
                  {formData.heroSubtitle}
                </p>

                <div className="pt-10 flex justify-center gap-6">
                  <div 
                    style={{ backgroundColor: formData.primaryColor }}
                    className="h-20 px-12 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-primary/20"
                  >
                    ابدأ الآن
                  </div>
                  <div className="h-20 px-12 rounded-[2rem] border-4 border-zinc-100 flex items-center justify-center font-black text-2xl">
                    عن المنصة
                  </div>
                </div>
              </div>
            </section>

            {/* Simulated Content */}
            <section className="py-20 px-10 grid grid-cols-3 gap-10">
              {[1,2,3].map(i => (
                <Card key={i} className="rounded-[2.5rem] border-2 shadow-lg p-10 space-y-6 bg-white border-transparent">
                  <div style={{ backgroundColor: formData.primaryColor }} className="w-16 h-16 rounded-2xl opacity-10"></div>
                  <div className="h-4 w-3/4 bg-zinc-100 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-zinc-50 rounded-full"></div>
                    <div className="h-2 w-5/6 bg-zinc-50 rounded-full"></div>
                  </div>
                </Card>
              ))}
            </section>

            {/* Footer Preview */}
            <footer className="mt-20 py-12 border-t px-10 flex flex-col md:flex-row justify-between items-center bg-zinc-900 text-white rounded-t-[4rem]">
              <div 
                className="text-lg font-black opacity-60 cursor-pointer hover:bg-white/10 p-2 rounded-xl"
                onClick={() => handleFieldClick('footerText', 'نص التذييل')}
              >
                {formData.footerText}
              </div>
              <div className="flex gap-4 opacity-20">
                <div className="w-8 h-8 rounded-full bg-white"></div>
                <div className="w-8 h-8 rounded-full bg-white"></div>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Editor Dialog */}
      <Dialog open={!!activeField} onOpenChange={() => setActiveField(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-2xl p-10" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
              <Edit3 className="text-primary" /> تعديل: {activeField?.label}
            </DialogTitle>
            <DialogDescription className="text-right text-lg font-bold">
              قم بتعديل النص وسنقوم بتحديث المعاينة فوراً.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <Label className="font-black mb-2 block">المحتوى الجديد</Label>
            {activeField?.key.toLowerCase().includes('subtitle') || activeField?.key.toLowerCase().includes('text') ? (
              <Textarea 
                value={activeField?.value} 
                onChange={(e) => setActiveField({...activeField!, value: e.target.value})}
                className="h-40 rounded-2xl border-2 text-xl font-medium p-6"
              />
            ) : (
              <Input 
                value={activeField?.value} 
                onChange={(e) => setActiveField({...activeField!, value: e.target.value})}
                className="h-16 rounded-2xl border-2 text-2xl font-black"
              />
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={updateField} className="flex-1 h-16 rounded-2xl font-black text-xl shadow-xl">
              تحديث المعاينة
            </Button>
            <Button variant="ghost" onClick={() => setActiveField(null)} className="h-16 px-8 rounded-2xl font-bold">إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-black opacity-60">{label}</Label>
      <div className="flex gap-2">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-12 w-12 rounded-xl cursor-pointer border-2 bg-transparent overflow-hidden" 
        />
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-12 font-mono font-bold text-xs flex-1 rounded-xl" 
        />
      </div>
    </div>
  );
}
