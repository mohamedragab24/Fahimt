
"use client";

import { useState, useRef } from "react";
import { useFirestore, useUser, useStorage, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  ImageIcon, 
  Loader2,
  Video,
  CloudUpload,
  Layers,
  Filter,
  Activity,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * صفحة إضافة عمل جديد للمعرض - تم تحديثها لفصل الفيديو عن الصورة المصغرة
 */
export default function AddPortfolioWork() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    categorySub: "",
    categoryOption: "",
    agreed: false
  });

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const subCategories = allCategories?.filter(c => c.type === 'sub' && c.parentId === allCategories?.find(m => m.name === formData.category)?.id) || [];
  const options = allCategories?.filter(c => c.type === 'option' && c.parentId === allCategories?.find(s => s.name === formData.categorySub)?.id) || [];

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({ variant: "destructive", title: "خطأ في الملف", description: "يرجى اختيار ملف فيديو فقط." });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "خطأ في الملف", description: "يرجى اختيار صورة فقط للغلاف." });
        return;
      }
      setThumbFile(file);
      setThumbPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage!, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => (prev + progress) / 2); // محاكاة تقدم تقريبي
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !storage || !user || !videoFile || !thumbFile || !formData.category) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول ورفع الفيديو والصورة المصغرة." });
      return;
    }

    if (!formData.agreed) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب تأكيد ملكية العمل للمتابعة." });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const timestamp = Date.now();
      const videoPath = `portfolio/${user.uid}/videos/${timestamp}_${videoFile.name}`;
      const thumbPath = `portfolio/${user.uid}/thumbs/${timestamp}_${thumbFile.name}`;

      const [videoUrl, thumbUrl] = await Promise.all([
        uploadFile(videoFile, videoPath),
        uploadFile(thumbFile, thumbPath)
      ]);
      
      await addDoc(collection(firestore, "portfolio"), {
        mufhemId: user.uid,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        categorySub: formData.categorySub,
        categoryOption: formData.categoryOption,
        mediaUrl: videoUrl,
        thumbnailUrl: thumbUrl,
        mediaType: "video",
        status: "pending_approval",
        views: 0,
        likes: 0,
        createdAt: new Date().toISOString()
      });

      toast({ title: "تم الإرسال للمراجعة", description: "سيتم مراجعة عملك من قبل الإدارة قبل نشره." });
      router.push("/portfolio");
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الرفع: " + err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 mb-20" dir="rtl">
      <div className="space-y-2 text-right">
        <h1 className="text-4xl font-black text-zinc-900 leading-tight">إضافة عمل جديد للمعرض</h1>
        <p className="text-muted-foreground font-bold text-lg">ارفع فيديوهات شرحك واعرض مهاراتك للطلاب (تخضع الأعمال للمراجعة).</p>
      </div>

      <Card className="shadow-2xl rounded-[3rem] border-2 overflow-hidden bg-white">
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            <div className="space-y-3 text-right">
              <Label className="text-lg font-black">عنوان العمل</Label>
              <Input 
                placeholder="ضع عنواناً مميزاً يصف عملك بدقة"
                className="h-16 rounded-2xl border-2 font-bold text-xl px-6"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3 text-right">
                <Label className="font-black flex items-center gap-2 justify-end">القسم <Layers size={14}/></Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v, categorySub: "", categoryOption: ""})}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                  <SelectContent>
                    {mainCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                    <SelectItem value="أخرى" className="font-bold text-primary">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 text-right">
                <Label className="font-black flex items-center gap-2 justify-end">التخصص <Filter size={14}/></Label>
                <Select disabled={!formData.category || formData.category === 'أخرى'} value={formData.categorySub} onValueChange={(v) => setFormData({...formData, categorySub: v, categoryOption: ""})}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                  <SelectContent>
                    {subCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                    <SelectItem value="أخرى" className="font-bold text-primary">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 text-right">
                <Label className="font-black flex items-center gap-2 justify-end">المهارة <Activity size={14}/></Label>
                <Select disabled={!formData.categorySub || formData.categorySub === 'أخرى'} value={formData.categoryOption} onValueChange={(v) => setFormData({...formData, categoryOption: v})}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="اختر المهارة" /></SelectTrigger>
                  <SelectContent>
                    {options.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                    <SelectItem value="أخرى" className="font-bold text-primary">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* خانة الصورة المصغرة */}
              <div className="space-y-3 text-right">
                <Label className="text-lg font-black flex items-center gap-2 justify-end">الصورة المصغرة (صورة فقط) <ImageIcon size={18}/></Label>
                <div 
                  onClick={() => !isSubmitting && thumbInputRef.current?.click()}
                  className={`relative h-60 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${thumbPreview ? 'border-primary/20' : 'border-zinc-200 hover:border-primary/40 bg-zinc-50'}`}
                >
                  {thumbPreview ? (
                    <img src={thumbPreview} className="w-full h-full object-cover" alt="Thumb Preview" />
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-2xl shadow-lg text-primary mb-3">
                        <Upload size={32} />
                      </div>
                      <p className="font-black text-zinc-500 text-sm">ارفع غلاف العمل</p>
                    </>
                  )}
                </div>
                <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={handleThumbChange} />
              </div>

              {/* خانة فيديو الشرح */}
              <div className="space-y-3 text-right">
                <Label className="text-lg font-black flex items-center gap-2 justify-end">فيديو الشرح (فيديو فقط) <Video size={18}/></Label>
                <div 
                  onClick={() => !isSubmitting && videoInputRef.current?.click()}
                  className={`relative h-60 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${videoPreview ? 'border-accent/20 bg-zinc-900' : 'border-zinc-200 hover:border-accent/40 bg-zinc-50'}`}
                >
                  {videoPreview ? (
                    <video src={videoPreview} className="w-full h-full object-contain" muted loop playsInline />
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-2xl shadow-lg text-accent mb-3">
                        <CloudUpload size={32} />
                      </div>
                      <p className="font-black text-zinc-500 text-sm">ارفع فيديو الشرح</p>
                    </>
                  )}
                </div>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
              </div>
            </div>

            <div className="space-y-3 text-right">
              <Label className="text-lg font-black">الوصف بالتفصيل</Label>
              <Textarea 
                placeholder="اشرح محتوى هذا العمل بالتفصيل"
                className="h-48 rounded-[2rem] border-2 p-8 text-lg font-medium leading-relaxed"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="flex items-start gap-4 p-8 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10">
              <Label htmlFor="agreed" className="text-xl font-bold leading-relaxed cursor-pointer select-none text-right flex-1">
                أقر بأن هذا العمل من مجهودي الشخصي ويوافق شروط المنصة <span className="text-red-500">*</span>
              </Label>
              <Checkbox id="agreed" checked={formData.agreed} onCheckedChange={(checked) => setFormData({...formData, agreed: !!checked})} className="mt-1 h-8 w-8 rounded-xl border-2" />
            </div>

            <div className="space-y-6">
              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black text-primary">
                    <span>جاري الرفع والمعالجة...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-3 rounded-full" />
                </div>
              )}
              <Button type="submit" disabled={isSubmitting || !videoFile || !thumbFile} className="w-full h-24 rounded-[2.5rem] text-3xl font-black bg-primary shadow-2xl hover:scale-[1.01] transition-all">
                {isSubmitting ? <><Loader2 className="animate-spin ml-3 h-10 w-10" /> جاري الحفظ...</> : "نشر العمل للمراجعة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
