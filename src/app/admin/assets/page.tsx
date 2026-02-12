
"use client";

import { useState, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, RefreshCw, Upload, CheckCircle2, Layout, Flower2, Monitor, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
          toast({ title: "تم التحديث!", description: "تم رفع الصورة الجديدة بنجاح وتحديث الموقع بالكامل." });
        } catch (err) {
          toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الصورة في قاعدة البيانات." });
        } finally {
          setUploadingKey(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري جلب مركز التحكم بالأصول...</div>;

  const assetItems = [
    { key: 'logoUrl', label: 'اللوجو الرئيسي للمنصة', desc: 'يظهر في الهيدر، القائمة الجانبية، وصفحة الدخول.', icon: Flower2 },
    { key: 'miniIconUrl', label: 'الأيقونة المصغرة (Favicon)', desc: 'تستخدم كأيقونة بجانب اسم الموقع وفي التنبيهات.', icon: Layout },
    { key: 'landingBg', label: 'خلفية صفحة الهبوط', desc: 'تظهر للزوار في الواجهة الأمامية (Desktop).', icon: Monitor },
    { key: 'studentHero', label: 'صورة واجهة الطلاب', desc: 'تظهر للطلاب عند طلب استفهام جديد.', icon: Users },
    { key: 'teacherHero', label: 'صورة واجهة المعلمين', desc: 'تظهر للمدرسين في لوحة التحكم.', icon: Users }
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 bg-zinc-50/50 min-h-screen" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl md:text-5xl font-black font-headline text-zinc-900">مركز إدارة الهوية البصرية</h1>
        <p className="text-muted-foreground text-xl">تحكم في اللوجو والصور؛ سيقوم النظام بتحديث الموقع لحظياً لكل المستخدمين.</p>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div className="grid gap-10">
        {assetItems.map((item) => (
          <Card key={item.key} className="shadow-2xl rounded-[3rem] border-2 border-primary/5 overflow-hidden bg-white hover:border-primary/20 transition-all">
            <CardHeader className="bg-muted/20 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-3xl text-primary">
                    <item.icon size={32} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-zinc-800">{item.label}</CardTitle>
                    <CardDescription className="text-lg font-bold text-muted-foreground">{item.desc}</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => { setActiveKey(item.key); fileInputRef.current?.click(); }}
                  disabled={uploadingKey === item.key}
                  className="h-16 px-10 rounded-[1.5rem] font-black text-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105"
                >
                  {uploadingKey === item.key ? <RefreshCw className="animate-spin ml-2" /> : <Upload className="ml-2 h-6 w-6" />}
                  رفع صورة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-zinc-100 text-zinc-600 px-6 py-1.5 rounded-full text-sm font-black uppercase">المعاينة الحالية</span>
                    <span className="text-xs text-muted-foreground font-bold">تحديث تلقائي مفعل</span>
                  </div>
                  <div className={`relative rounded-[2.5rem] overflow-hidden border-4 border-dashed border-zinc-200 bg-zinc-50 group flex items-center justify-center ${item.key === 'logoUrl' || item.key === 'miniIconUrl' ? 'h-48' : 'aspect-video'}`}>
                    {settings?.[item.key] ? (
                      <img 
                        src={settings[item.key]} 
                        alt={item.label} 
                        className={`transition-transform group-hover:scale-105 ${item.key === 'logoUrl' || item.key === 'miniIconUrl' ? 'max-h-32 object-contain' : 'object-cover w-full h-full'}`} 
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                        <ImageIcon size={64} />
                        <p className="font-black mt-2 text-xl">لا توجد صورة</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary/5 p-10 rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl text-primary animate-bounce">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-primary">نظام المزامنة اللحظية</h4>
                    <p className="text-zinc-600 font-bold leading-relaxed">بمجرد الضغط على رفع واختيار الملف، سيتغير {item.label} في كافة صفحات الموقع وتطبيقات الجوال المرتبطة دون الحاجة لإعادة التحميل.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm text-green-600 font-black">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    متصل بـ Firebase Live
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
