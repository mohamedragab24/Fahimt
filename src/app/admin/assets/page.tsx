
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Save, RefreshCw, Globe, Image as LucideImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminAssets() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
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

  const handleSave = async () => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, "settings", "general"), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "تم الحفظ", description: "تم تحديث روابط الصور في النظام بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الإعدادات." });
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري جلب إعدادات الصور...</div>;

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة أصول الموقع</h1>
        <p className="text-muted-foreground text-lg">تحكم في الصور والخلفيات التي يراها المستخدمون عبر Firebase.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl rounded-[2.5rem] border-2">
          <CardHeader className="bg-primary text-white p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Globe className="h-6 w-6" /> روابط الصور الحية
            </CardTitle>
            <CardDescription className="text-white/80 font-bold">ضع روابط الصور المرفوعة (Firebase Storage أو Unsplash)</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <AssetInput 
                label="خلفية صفحة الهبوط (Landing Page)" 
                value={formData.landingBg} 
                onChange={(v) => setFormData({...formData, landingBg: v})} 
              />
              <AssetInput 
                label="صورة الطالب (Student Hero)" 
                value={formData.studentHero} 
                onChange={(v) => setFormData({...formData, studentHero: v})} 
              />
              <AssetInput 
                label="صورة المعلم (Teacher Hero)" 
                value={formData.teacherHero} 
                onChange={(v) => setFormData({...formData, teacherHero: v})} 
              />
            </div>
            <Button onClick={handleSave} className="w-full h-16 rounded-2xl font-black text-xl shadow-lg mt-6">
              <Save className="ml-2 h-6 w-6" /> حفظ التغييرات الآن
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <h3 className="text-2xl font-black flex items-center gap-2">
            <LucideImage className="text-primary" /> معاينة مباشرة
          </h3>
          <div className="grid gap-6">
            <PreviewCard label="خلفية الهبوط الحالية" url={formData.landingBg} />
            <div className="grid grid-cols-2 gap-4">
              <PreviewCard label="صورة الطالب" url={formData.studentHero} />
              <PreviewCard label="صورة المعلم" url={formData.teacherHero} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetInput({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <Label className="font-bold text-lg">{label}</Label>
      <Input 
        placeholder="https://example.com/image.jpg" 
        className="h-14 rounded-xl border-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PreviewCard({ label, url }: any) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-2 bg-muted/5">
      <div className="p-4 bg-muted/30 border-b">
        <span className="font-black text-xs uppercase tracking-widest">{label}</span>
      </div>
      <div className="relative aspect-video w-full">
        {url ? (
          <img src={url} alt={label} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
            <ImageIcon size={48} />
            <p className="font-bold mt-2">لا يوجد رابط مضاف</p>
          </div>
        )}
      </div>
    </Card>
  );
}
