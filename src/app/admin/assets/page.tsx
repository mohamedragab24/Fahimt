"use client";

import { useState, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, RefreshCw, Upload, CheckCircle2, Layout, Flower2, Monitor, Users, Sparkles, AlertCircle, Zap, Box, Globe, ShieldCheck, Share2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { PlaceHolderImages } from "@/lib/placeholder-images";

/**
 * مركز التحكم بالأصول الرسومية.
 * يتيح للمسؤول تغيير كافة صور المنصة المخزنة في Firebase.
 */
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
          toast({ title: "تم التحديث في Firebase!", description: "تم تغيير الصورة بنجاح وستظهر في كافة الأنظمة الآن." });
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
    if (key === 'logoUrl' || key === 'miniIconUrl' || key === 'faviconUrl' || key === 'splashImageUrl') return "https://placehold.co/400x400?text=Fahimni";
    if (key === 'verifiedBadgeUrl') return PlaceHolderImages.find(i => i.id === 'verified-badge')?.imageUrl;
    if (key === 'landingBg') return PlaceHolderImages.find(i => i.id === 'landing-bg')?.imageUrl;
    if (key === 'studentHero') return PlaceHolderImages.find(i => i.id === 'hero-student')?.imageUrl;
    if (key === 'teacherHero') return PlaceHolderImages.find(i => i.id === 'hero-teacher')?.imageUrl;
    if (key === 'ogImageUrl') return "https://picsum.photos/seed/og/1200/630";
    if (key === 'aboutImage') return "https://picsum.photos/seed/about/800/600";
    return "https://placehold.co/600x400?text=Placeholder";
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل مركز الأصول...</div>;

  const assetItems = [
    { key: 'faviconUrl', label: 'أيقونة المتصفح (Favicon)', desc: 'تظهر في لسان المتصفح وبجانب رابط الموقع.', icon: Globe },
    { key: 'ogImageUrl', label: 'صورة المعاينة (Social Preview)', desc: 'تظهر عند مشاركة الرابط على واتساب وتطبيقات التواصل.', icon: Share2 },
    { key: 'logoUrl', label: 'اللوجو الرئيسي', desc: 'يظهر في الهيدر وصفحات الدخول.', icon: Flower2 },
    { key: 'miniIconUrl', label: 'الأيقونة المصغرة', desc: 'تظهر في القائمة الجانبية والهيدر المصغر.', icon: Layout },
    { key: 'verifiedBadgeUrl', label: 'شارة التوثيق', desc: 'تظهر بجانب أسماء الخبراء الموثقين.', icon: ShieldCheck },
    { key: 'splashImageUrl', label: 'صورة الترحيب (Splash)', desc: 'تظهر للمستخدمين عند الدخول لأول مرة.', icon: Zap },
    { key: 'landingBg', label: 'خلفية الهيرو', desc: 'خلفية قسم العنوان الرئيسي في صفحة الهبوط.', icon: Monitor },
    { key: 'aboutImage', label: 'صورة "عن المنصة"', desc: 'تظهر في صفحة التعريف بالمنصة.', icon: Info }
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 bg-zinc-50/50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-zinc-900">إدارة صور المنصة (Firebase)</h1>
          <p className="text-muted-foreground text-xl">تحكم كامل في كافة الأصول الرسومية؛ أي تعديل هنا يُحفظ مباشرة في قاعدة البيانات.</p>
        </div>
        <div className="bg-green-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-green-100">
          <Sparkles className="text-green-600 h-6 w-6" />
          <span className="font-black text-green-700">مزامنة الصور مع Firebase مفعلة</span>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div className="grid gap-8">
        {assetItems.map((item) => {
          const currentImage = settings?.[item.key] || getFallbackImage(item.key);
          return (
            <Card key={item.key} className="shadow-xl rounded-[2.5rem] border-2 border-primary/5 overflow-hidden bg-white hover:border-primary/20 transition-all group">
              <CardHeader className="bg-muted/10 p-8 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-4 rounded-3xl group-hover:scale-110 transition-transform">
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
                    className="h-16 px-10 rounded-2xl font-black text-xl shadow-xl"
                  >
                    {uploadingKey === item.key ? <RefreshCw className="animate-spin ml-2" /> : <Upload className="ml-2 h-6 w-6" />}
                    رفع وتغيير الصورة
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-500 font-black uppercase text-xs">
                      <AlertCircle size={14} /> المعاينة المستمدة من Firebase
                    </div>
                    <div className={`relative rounded-[2.5rem] overflow-hidden border-4 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center ${item.key === 'faviconUrl' || item.key === 'miniIconUrl' || item.key === 'verifiedBadgeUrl' ? 'h-48' : 'aspect-video'}`}>
                      <img 
                        src={currentImage} 
                        alt={item.label} 
                        className={`${item.key === 'faviconUrl' || item.key === 'logoUrl' || item.key === 'miniIconUrl' || item.key === 'verifiedBadgeUrl' ? 'max-h-40 object-contain p-4' : 'object-cover w-full h-full'}`} 
                      />
                    </div>
                  </div>

                  <div className="p-10 rounded-[3rem] border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl text-primary">
                      <CheckCircle2 size={40} className="animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-primary">تحكم فوري</h4>
                      <p className="text-zinc-600 font-bold leading-relaxed">
                        بمجرد رفع الصورة هنا، يتم تحديث الرابط في مستند الإعدادات بـ Firebase، مما يضمن تغييرها لكل المستخدمين فوراً.
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
