
"use client";

import { useState, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, RefreshCw, Upload, CheckCircle2, Layout, Flower2, Monitor, Users, Sparkles, AlertCircle, Zap, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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
          const settingsRef = doc(firestore, "settings", "general");
          setDocumentNonBlocking(settingsRef, {
            [activeKey]: base64,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          toast({ title: "تم التحديث!", description: "تم رفع الملف بنجاح وتحديث قاعدة البيانات." });
        } catch (err) {
          console.error(err);
          toast({ variant: "destructive", title: "خطأ", description: "فشل التحديث، تأكد من صلاحياتك." });
        } finally {
          setUploadingKey(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getFallbackImage = (key: string) => {
    if (key === 'logoUrl' || key === 'miniIconUrl' || key === 'splashImageUrl') return "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400";
    if (key === 'landingBg') return PlaceHolderImages.find(i => i.id === 'landing-bg')?.imageUrl;
    if (key === 'studentHero') return PlaceHolderImages.find(i => i.id === 'hero-student')?.imageUrl;
    if (key === 'teacherHero') return PlaceHolderImages.find(i => i.id === 'hero-teacher')?.imageUrl;
    return "https://placehold.co/600x400?text=Placeholder";
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل مركز التحكم بالأصول...</div>;

  const assetItems = [
    { key: 'logoUrl', label: 'اللوجو الرئيسي للمنصة', desc: 'يظهر في الهيدر وصفحة الدخول الرئيسية.', icon: Flower2 },
    { key: 'miniIconUrl', label: 'أيقونة المتصفح (Favicon)', desc: 'تظهر في علامة تبويب المتصفح وبجانب اسم الموقع.', icon: Layout },
    { key: 'splashImageUrl', label: 'نافذة الترحيب المنبثقة (Splash)', desc: 'تظهر للمستخدم كـ Welcome Modal عند فتح الموقع.', icon: Zap },
    { key: 'landingBg', label: 'خلفية صفحة الهبوط', desc: 'الصورة الكبيرة خلف عنوان الموقع الرئيسي.', icon: Monitor },
    { key: 'studentHero', label: 'صورة واجهة الطالب', desc: 'تظهر في لوحة تحكم الطلاب (Mustafhems).', icon: Users },
    { key: 'teacherHero', label: 'صورة واجهة المعلم', desc: 'تظهر للمدرسين في لوحة تحكم المفهمين.', icon: Box }
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 bg-zinc-50/50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-zinc-900">مركز إدارة جميع صور المنصة</h1>
          <p className="text-muted-foreground text-xl">تحكم كامل في الأصول المخزنة في Firebase؛ التحديث يطبق فوراً للجميع.</p>
        </div>
        <div className="bg-primary/10 px-6 py-3 rounded-2xl flex items-center gap-3">
          <Sparkles className="text-primary h-6 w-6" />
          <span className="font-black text-primary">قاعدة البيانات متصلة</span>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div className="grid gap-10">
        {assetItems.map((item) => {
          const currentImage = settings?.[item.key] || getFallbackImage(item.key);
          return (
            <Card key={item.key} className="shadow-2xl rounded-[3rem] border-2 border-primary/5 overflow-hidden bg-white hover:border-primary/20 transition-all group">
              <CardHeader className="bg-muted/20 p-8 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-3xl text-primary group-hover:scale-110 transition-transform">
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
                    className="h-16 px-10 rounded-[1.5rem] font-black text-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
                  >
                    {uploadingKey === item.key ? <RefreshCw className="animate-spin ml-2" /> : <Upload className="ml-2 h-6 w-6" />}
                    رفع صورة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-500 font-black uppercase text-xs">
                      <AlertCircle size={14} /> المعاينة الحالية (من الفايربيز)
                    </div>
                    <div className={`relative rounded-[2.5rem] overflow-hidden border-4 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center ${item.key === 'logoUrl' || item.key === 'miniIconUrl' || item.key === 'splashImageUrl' ? 'h-48' : 'aspect-video'}`}>
                      {currentImage ? (
                        <img 
                          src={currentImage} 
                          alt={item.label} 
                          className={`${item.key === 'logoUrl' || item.key === 'miniIconUrl' || item.key === 'splashImageUrl' ? 'max-h-40 object-contain p-4' : 'object-cover w-full h-full'}`} 
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                          <ImageIcon size={64} />
                          <p className="font-black mt-2 text-xl">لا توجد صورة</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-primary/5 p-10 rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl text-primary">
                      <CheckCircle2 size={40} className="animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-primary">مزامنة فورية</h4>
                      <p className="text-zinc-600 font-bold leading-relaxed">
                        بمجرد الحفظ، سيتم تحديث هذا الأصل في قاعدة بيانات الفايربيز وظهوره لجميع المستخدمين في نفس اللحظة.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
