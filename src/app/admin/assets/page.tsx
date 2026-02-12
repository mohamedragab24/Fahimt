
"use client";

import { useState, useEffect, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Save, RefreshCw, Upload, Trash2, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminAssets() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeKey && firestore) {
      setUploadingKey(activeKey);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await updateDoc(doc(firestore, "settings", "general"), {
            [activeKey]: base64,
            updatedAt: new Date().toISOString()
          });
          toast({ title: "تم التحديث!", description: "تم رفع الصورة الجديدة بنجاح وتحديث الموقع." });
        } catch (err) {
          toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الصورة في قاعدة البيانات." });
        } finally {
          setUploadingKey(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري جلب إعدادات الصور...</div>;

  const assetItems = [
    { key: 'landingBg', label: 'خلفية صفحة الهبوط الرئيسية', desc: 'تظهر للزوار في الواجهة الأمامية.' },
    { key: 'studentHero', label: 'صورة واجهة الطلاب', desc: 'تظهر للطلاب عند طلب استفهام جديد.' },
    { key: 'teacherHero', label: 'صورة واجهة المعلمين', desc: 'تظهر للمدرسين في لوحة التحكم الخاصة بهم.' }
  ];

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">مركز إدارة الأصول الذكي</h1>
        <p className="text-muted-foreground text-lg">ارفع الصور مباشرة؛ سيقوم النظام بعرض القديمة والجديدة وتحديث الموقع تلقائياً.</p>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div className="grid gap-10">
        {assetItems.map((item) => (
          <Card key={item.key} className="shadow-2xl rounded-[3rem] border-2 border-primary/5 overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-black text-primary">{item.label}</CardTitle>
                  <CardDescription className="text-lg font-bold">{item.desc}</CardDescription>
                </div>
                <Button 
                  onClick={() => { setActiveKey(item.key); fileInputRef.current?.click(); }}
                  disabled={uploadingKey === item.key}
                  className="h-16 px-10 rounded-2xl font-black text-xl bg-primary hover:bg-primary/90 shadow-xl"
                >
                  {uploadingKey === item.key ? <RefreshCw className="animate-spin ml-2" /> : <Upload className="ml-2 h-6 w-6" />}
                  تغيير الصورة الآن
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  <span className="bg-zinc-100 text-zinc-600 px-4 py-1 rounded-full text-xs font-black uppercase">المعاينة الحالية في الموقع</span>
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-dashed border-zinc-200 bg-zinc-50 group">
                    {settings?.[item.key] ? (
                      <img src={settings[item.key]} alt="Current" className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                        <ImageIcon size={64} />
                        <p className="font-black mt-2">لا توجد صورة حالياً</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-dashed border-primary/20 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-primary">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-black text-primary">نظام التحديث التلقائي نشط</h4>
                  <p className="text-muted-foreground font-bold">بمجرد اختيار ملف جديد، سيتم استبدال الصورة القديمة فوراً في كافة صفحات الموقع دون الحاجة لإعادة تحميل الصفحة.</p>
                  <div className="flex items-center gap-2 text-green-600 font-black">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    متصل بـ Firebase Realtime
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
