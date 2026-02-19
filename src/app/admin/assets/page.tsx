"use client";

import { useState, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, 
  RefreshCw, 
  Upload, 
  CheckCircle2, 
  Flower2, 
  Monitor, 
  Zap, 
  Globe, 
  ShieldCheck, 
  Share2, 
  Info, 
  Smartphone,
  LayoutTemplate,
  BadgeCheck,
  AppWindow
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * صفحة إدارة صور المنصة وأصول PWA.
 * كافة الصور هنا يتم ربطها بقاعدة البيانات وتحديثها لحظياً.
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
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "الملف كبير جداً", description: "يرجى اختيار صورة أقل من 1MB لضمان السرعة." });
        return;
      }

      setUploadingKey(activeKey);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await setDoc(doc(firestore, "settings", "general"), {
            [activeKey]: base64,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          toast({ title: "تم التحديث بنجاح", description: "الصورة الآن جزء من هوية المنصة الرقمية." });
        } catch (err) {
          toast({ variant: "destructive", title: "خطأ في الحفظ" });
        } finally {
          setUploadingKey(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const assetItems = [
    { key: 'logoUrl', label: 'اللوجو الرئيسي', desc: 'يظهر في صفحة الهبوط والترويسة.', icon: Flower2 },
    { key: 'miniIconUrl', label: 'اللوجو الصغير', desc: 'يظهر بجانب القائمة الجانبية في الترويسة.', icon: AppWindow },
    { key: 'landingBg', label: 'خلفية الهيرو', desc: 'خلفية صفحة الهبوط الرئيسية.', icon: Monitor },
    { key: 'aboutImage', label: 'صورة "عن المنصة"', desc: 'تظهر في صفحة التعريف.', icon: Info },
    { key: 'splashImageUrl', label: 'صورة الترحيب', desc: 'تظهر كـ Popup للمستخدمين الجدد.', icon: Zap },
    { key: 'faviconUrl', label: 'أيقونة المتصفح (Favicon)', desc: 'تظهر في لسان المتصفح.', icon: Globe },
    { key: 'icon192', label: 'أيقونة PWA (192x192)', desc: 'أيقونة التطبيق على شاشة الهاتف.', icon: Smartphone },
    { key: 'icon512', label: 'أيقونة PWA (512x512)', desc: 'أيقونة شاشة التحميل والمتجر.', icon: LayoutTemplate },
    { key: 'ogImageUrl', label: 'صورة المشاركة (Social)', desc: 'تظهر عند مشاركة الرابط.', icon: Share2 },
    { key: 'verifiedBadgeUrl', label: 'شارة التوثيق الزرقاء', desc: 'تظهر بجانب أسماء الحسابات الموثقة.', icon: BadgeCheck }
  ];

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse text-2xl">جاري تحميل مركز الأصول...</div>;

  return (
    <div className="p-6 md:p-10 space-y-10 bg-zinc-50/50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">إدارة الصور والهوية</h1>
          <p className="text-muted-foreground text-xl">تحكم كامل في كافة الرسوميات التي يراها المستخدم في المنصة.</p>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assetItems.map((item) => {
          const currentImage = settings?.[item.key] || "https://placehold.co/400x300?text=No+Image";
          return (
            <Card key={item.key} className="shadow-xl rounded-[2.5rem] border-2 border-primary/5 overflow-hidden bg-white hover:border-primary/20 transition-all group">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-4 rounded-3xl">
                      <item.icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-zinc-800">{item.label}</h3>
                      <p className="text-xs font-bold text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setActiveKey(item.key); fileInputRef.current?.click(); }}
                    disabled={uploadingKey === item.key}
                    className="rounded-xl font-black border-2"
                  >
                    {uploadingKey === item.key ? <RefreshCw className="animate-spin" /> : <Upload size={16} />}
                  </Button>
                </div>

                <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center">
                  <img 
                    src={currentImage} 
                    alt={item.label} 
                    className={`${item.key.includes('icon') || item.key.includes('logo') || item.key.includes('Badge') || item.key.includes('miniIcon') ? 'h-32 w-32 object-contain' : 'w-full h-full object-cover'}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
