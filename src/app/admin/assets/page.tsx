
"use client";

import { useState, useEffect, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Save, RefreshCw, Globe, Image as LucideImage, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminAssets() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    landingBg: "",
    logoUrl: "",
    studentHero: "",
    teacherHero: ""
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        landingBg: settings.landingBg || "",
        logoUrl: settings.logoUrl || "",
        studentHero: settings.studentHero || "",
        teacherHero: settings.teacherHero || ""
      });
    }
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeKey) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [activeKey]: reader.result as string }));
        toast({ title: "تم تجهيز الصورة", description: "اضغط على حفظ لاعتماد التغيير نهائياً." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, "settings", "general"), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "تم الحفظ", description: "تم تحديث كافة الصور في النظام بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الإعدادات." });
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري جلب إعدادات الصور...</div>;

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة أصول الموقع</h1>
        <p className="text-muted-foreground text-lg">ارفع الصور مباشرة أو ضع روابط لتحديث مظهر المنصة فوراً.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <AssetCard 
            title="خلفية صفحة الهبوط" 
            value={formData.landingBg} 
            onUpload={() => { setActiveKey('landingBg'); fileInputRef.current?.click(); }}
            onLinkChange={(v) => setFormData({...formData, landingBg: v})}
          />
          <AssetCard 
            title="صورة واجهة الطلاب" 
            value={formData.studentHero} 
            onUpload={() => { setActiveKey('studentHero'); fileInputRef.current?.click(); }}
            onLinkChange={(v) => setFormData({...formData, studentHero: v})}
          />
          <AssetCard 
            title="صورة واجهة المعلمين" 
            value={formData.teacherHero} 
            onUpload={() => { setActiveKey('teacherHero'); fileInputRef.current?.click(); }}
            onLinkChange={(v) => setFormData({...formData, teacherHero: v})}
          />
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          
          <Button onClick={handleSave} className="w-full h-20 rounded-3xl font-black text-2xl shadow-2xl bg-primary hover:bg-primary/90 mt-10">
            <Save className="ml-3 h-8 w-8" /> حفظ كافة التغييرات
          </Button>
        </div>

        <div className="space-y-8">
          <h3 className="text-2xl font-black flex items-center gap-2">
            <LucideImage className="text-primary" /> معاينة الأصول الحالية
          </h3>
          <div className="grid gap-6">
            <PreviewCard label="خلفية الهبوط" url={formData.landingBg} />
            <div className="grid grid-cols-2 gap-4">
              <PreviewCard label="للطلاب" url={formData.studentHero} />
              <PreviewCard label="للمعلمين" url={formData.teacherHero} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetCard({ title, value, onUpload, onLinkChange }: any) {
  return (
    <Card className="shadow-lg rounded-[2rem] border-2 overflow-hidden bg-white">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-xl font-black">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="أو ضع رابط مباشر للصورة هنا..." 
            className="h-12 rounded-xl border-2"
            value={value?.startsWith('data:') ? 'صورة مرفوعة يدوياً' : value}
            onChange={(e) => onLinkChange(e.target.value)}
          />
          <Button onClick={onUpload} variant="secondary" className="h-12 rounded-xl font-bold">
            <Upload className="ml-2 h-4 w-4" /> رفع ملف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewCard({ label, url }: any) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-2 bg-muted/5 group">
      <div className="p-3 bg-muted/30 border-b flex justify-between items-center">
        <span className="font-black text-xs uppercase tracking-widest">{label}</span>
        {url && <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>}
      </div>
      <div className="relative aspect-video w-full bg-zinc-100 flex items-center justify-center">
        {url ? (
          <img src={url} alt={label} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground opacity-20">
            <ImageIcon size={48} />
            <p className="font-bold mt-2">فارغ</p>
          </div>
        )}
      </div>
    </Card>
  );
}
