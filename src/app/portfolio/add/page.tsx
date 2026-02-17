
"use client";

import { useState, useRef } from "react";
import { useFirestore, useUser, useStorage } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  Upload, 
  ImageIcon, 
  Calendar, 
  CheckCircle2, 
  Loader2,
  X,
  Plus,
  Video,
  CloudUpload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const SUGGESTED_SKILLS = [
  "Adobe Illustrator", "تصميم متجر إلكتروني", "ووردبريس", "تصوير الفيديو", 
  "إعادة صياغة المحتوى", "تصميم موقع إلكتروني", "تصميم جرافيك", 
  "فوتوشوب", "مونتاج فيديو", "كتابة مقالات", "تجسيد 3D"
];

export default function AddPortfolioWork() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaType: "image" as "image" | "video",
    completionDate: "",
    skills: [] as string[],
    agreed: false
  });

  const [skillInput, setSkillsInput] = useState("");

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "الملف كبير جداً",
          description: "يرجى اختيار ملف أقل من 50 ميجابايت."
        });
        return;
      }

      setSelectedFile(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setFormData(prev => ({ ...prev, mediaType: type }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !storage || !user || !selectedFile) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى اختيار الملف وتعبئة البيانات." });
      return;
    }

    if (!formData.agreed) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب تأكيد ملكية العمل للمتابعة." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. الرفع إلى Firebase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `portfolio/${user.uid}/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          toast({ variant: "destructive", title: "فشل الرفع", description: error.message });
          setIsSubmitting(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 2. حفظ البيانات في Firestore
          await addDoc(collection(firestore, "portfolio"), {
            mufhemId: user.uid,
            title: formData.title,
            description: formData.description,
            mediaUrl: downloadUrl,
            mediaType: formData.mediaType,
            completionDate: formData.completionDate,
            skills: formData.skills,
            status: "pending_approval",
            createdAt: new Date().toISOString()
          });

          toast({ title: "تم الإرسال بنجاح", description: "سيتم مراجعة عملك ونشره قريباً." });
          router.push("/portfolio");
        }
      );
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ البيانات." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10" dir="rtl">
      <nav className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <button onClick={() => router.push('/')} className="hover:text-primary transition-colors">الرئيسية</button>
        <ChevronRight size={14} className="rotate-180" />
        <button onClick={() => router.push('/portfolio')} className="hover:text-primary transition-colors">أعمالي</button>
      </nav>

      <div className="space-y-2">
        <h1 className="text-4xl font-black text-zinc-900 leading-tight">إضافة عمل جديد للمعرض</h1>
        <p className="text-muted-foreground font-bold text-lg">ارفع فيديوهات شرحك (بحد أقصى 50MB) واعرض مهاراتك للطلاب.</p>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] border-2 overflow-hidden bg-white">
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            <div className="space-y-3 text-right">
              <Label className="text-lg font-black flex items-center gap-2 justify-end">
                عنوان العمل <span className="text-red-500">*</span>
              </Label>
              <Input 
                placeholder="مثال: شرح مبسط لقواعد اللغة العربية"
                className="h-14 rounded-2xl border-2 font-bold text-right"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="space-y-3 text-right">
              <Label className="text-lg font-black flex items-center gap-2 justify-end">
                الفيديو أو الصورة التوضيحية <span className="text-red-500">*</span>
              </Label>
              <div 
                onClick={() => !isSubmitting && thumbInputRef.current?.click()}
                className={`relative h-72 rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${previewUrl ? 'border-primary/20 bg-zinc-900' : 'border-zinc-200 hover:border-primary/40 bg-zinc-50'}`}
              >
                {previewUrl ? (
                  formData.mediaType === 'video' ? (
                    <video src={previewUrl} className="w-full h-full object-contain" controls={false} autoPlay muted loop playsInline />
                  ) : (
                    <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                  )
                ) : (
                  <>
                    <div className="bg-white p-5 rounded-3xl shadow-xl text-primary mb-4">
                      <CloudUpload size={40} />
                    </div>
                    <p className="font-black text-zinc-600">اضغط لرفع الفيديو أو الصورة</p>
                    <p className="text-xs text-zinc-400 font-bold mt-2">الحد الأقصى للملف: 50 ميجابايت</p>
                  </>
                )}
                
                {isSubmitting && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 space-y-4">
                    <Loader2 className="animate-spin text-white h-12 w-12" />
                    <p className="text-white font-black text-xl">جاري الرفع السحابي...</p>
                    <div className="w-full max-w-xs">
                      <Progress value={uploadProgress} className="h-3 bg-white/20" />
                      <p className="text-white text-center mt-2 font-bold">{Math.round(uploadProgress)}%</p>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={thumbInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-3 text-right">
              <Label className="text-lg font-black flex items-center gap-2 justify-end">
                وصف العمل والمهارات المستخدمة <span className="text-red-500">*</span>
              </Label>
              <Textarea 
                placeholder="اشرح باختصار ما سيستفيده الطالب من هذا العمل..."
                className="h-48 rounded-[2rem] border-2 p-6 text-lg font-medium leading-relaxed text-right"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-zinc-100 space-y-6">
              <h5 className="font-black text-sm text-zinc-500 uppercase tracking-widest text-right">المهارات ذات الصلة</h5>
              <div className="flex flex-wrap gap-2 justify-end">
                {SUGGESTED_SKILLS.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 ${formData.skills.includes(skill) ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-zinc-600 border-zinc-200 hover:border-primary/40'}`}
                  >
                    {skill} {formData.skills.includes(skill) ? <X size={12} /> : <Plus size={12} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t-2 border-dashed space-y-6">
              <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/10 justify-end">
                <Label htmlFor="agreed" className="text-lg font-bold leading-relaxed cursor-pointer select-none text-right flex-1">
                  أقر بأن هذا العمل من مجهودي الشخصي ولا ينتهك حقوق الآخرين <span className="text-red-500">*</span>
                </Label>
                <Checkbox 
                  id="agreed" 
                  checked={formData.agreed} 
                  onCheckedChange={(checked) => setFormData({...formData, agreed: !!checked})}
                  className="mt-1 h-6 w-6"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedFile}
              className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary hover:bg-primary/90 shadow-2xl transition-all"
            >
              {isSubmitting ? <><Loader2 className="ml-3 animate-spin" /> جاري الحفظ...</> : "نشر العمل في المعرض الآن"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
