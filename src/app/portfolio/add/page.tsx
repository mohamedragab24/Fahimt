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
          setUploadProgress(progress);
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

    setIsSubmitting(true);
    try {
      const timestamp = Date.now();
      const videoUrl = await uploadFile(videoFile, `portfolio/${user.uid}/videos/${timestamp}`);
      const thumbUrl = await uploadFile(thumbFile, `portfolio/${user.uid}/thumbs/${timestamp}`);
      
      await addDoc(collection(firestore, "portfolio"), {
        mufhemId: user.uid,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        mediaUrl: videoUrl,
        thumbnailUrl: thumbUrl,
        mediaType: "video",
        status: "pending_approval",
        createdAt: new Date().toISOString()
      });

      toast({ title: "تم الإرسال للمراجعة" });
      router.push("/portfolio");
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ في الرفع" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 mb-20" dir="rtl">
      <div className="space-y-2 text-right">
        <h1 className="text-4xl font-black text-zinc-900">إضافة عمل جديد للمعرض</h1>
        <p className="text-muted-foreground font-bold text-lg">اعرض مهاراتك التعليمية للطلاب (تخضع الأعمال للمراجعة).</p>
      </div>

      <Card className="shadow-2xl rounded-[3rem] border-2 bg-white">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 text-right">
                <Label className="text-lg font-black flex items-center gap-2 justify-end">الصورة المصغرة (صورة فقط) <ImageIcon size={18}/></Label>
                <div 
                  onClick={() => thumbInputRef.current?.click()}
                  className="relative h-60 rounded-[2.5rem] border-4 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                >
                  {thumbPreview ? <img src={thumbPreview} className="w-full h-full object-cover" /> : <Upload size={32} className="text-primary" />}
                </div>
                <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={handleThumbChange} />
              </div>

              <div className="space-y-3 text-right">
                <Label className="text-lg font-black flex items-center gap-2 justify-end">فيديو الشرح (فيديو فقط) <Video size={18}/></Label>
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className="relative h-60 rounded-[2.5rem] border-4 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                >
                  {videoPreview ? <video src={videoPreview} className="w-full h-full object-contain" muted /> : <CloudUpload size={32} className="text-accent" />}
                </div>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
              </div>
            </div>

            <div className="space-y-3 text-right">
              <Label className="text-lg font-black">اشرح محتوى هذا العمل بالتفصيل</Label>
              <Textarea 
                className="h-48 rounded-[2rem] border-2 p-8 text-lg font-medium"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-24 rounded-[2.5rem] text-3xl font-black bg-primary">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "نشر العمل للمراجعة"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
