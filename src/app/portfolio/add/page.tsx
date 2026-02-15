
"use client";

import { useState, useRef } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertTriangle
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
  const router = useRouter();
  const { toast } = useToast();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    mediaType: "image" as "image" | "video",
    completionDate: "",
    skills: [] as string[],
    agreed: false
  });

  const [skillInput, setSkillsInput] = useState("");

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // الحد الأقصى 50 ميجابايت
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "الملف كبير جداً",
          description: "يرجى اختيار ملف (صورة أو فيديو) بحجم أقل من 50 ميجابايت."
        });
        if (thumbInputRef.current) thumbInputRef.current.value = "";
        return;
      }

      const type = file.type.startsWith('video') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnail: reader.result as string, mediaType: type }));
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
    if (!firestore || !user) return;

    const titleWords = countWords(formData.title);
    const descWords = countWords(formData.description);

    if (titleWords > 100) {
      toast({
        variant: "destructive",
        title: "العنوان طويل جداً",
        description: `لقد كتبت ${titleWords} كلمة، والحد الأقصى هو 100 كلمة.`
      });
      return;
    }

    if (descWords > 600) {
      toast({
        variant: "destructive",
        title: "الوصف طويل جداً",
        description: `لقد كتبت ${descWords} كلمة، والحد الأقصى هو 600 كلمة.`
      });
      return;
    }

    if (!formData.thumbnail || !formData.title || !formData.description || !formData.agreed) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة الحقول الأساسية وتأكيد ملكية العمل." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, "portfolio"), {
        mufhemId: user.uid,
        title: formData.title,
        description: formData.description,
        mediaUrl: formData.thumbnail,
        mediaType: formData.mediaType,
        completionDate: formData.completionDate,
        skills: formData.skills,
        status: "pending_approval", 
        createdAt: new Date().toISOString()
      });

      toast({ title: "تم الإرسال للمراجعة", description: "سيتم نشر عملك فور مراجعته من قبل الإدارة." });
      router.push("/portfolio");
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ العمل، يرجى المحاولة لاحقاً." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10" dir="rtl">
      <nav className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <button onClick={() => router.push('/')} className="hover:text-primary transition-colors">الرئيسية</button>
        <ChevronRight size={14} />
        <button onClick={() => router.push('/portfolio')} className="hover:text-primary transition-colors">أعمالي</button>
      </nav>

      <h1 className="text-4xl font-black text-zinc-900 leading-tight">إضافة عمل جديد للمعرض</h1>
      <p className="text-muted-foreground font-bold text-lg -mt-6">سيتم مراجعة العمل من قبل الإدارة قبل ظهوره للطلاب.</p>

      <Card className="shadow-2xl rounded-[2.5rem] border-2 overflow-hidden bg-white">
        <CardContent className="p-10 space-y-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            <div className="space-y-3 text-right">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground">الحد الأقصى: 100 كلمة (كتبت: {countWords(formData.title)})</span>
                <Label className="text-lg font-black flex items-center gap-2 justify-end">
                  عنوان العمل <span className="text-red-500">*</span>
                </Label>
              </div>
              <Input 
                placeholder="مثال: شرح أساسيات الجبر الخطي"
                className={`h-14 rounded-2xl border-2 font-bold text-right ${countWords(formData.title) > 100 ? 'border-red-500' : ''}`}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-3 text-right">
              <Label className="text-lg font-black flex items-center gap-2 justify-end">
                الملف المرئي (صورة أو فيديو) <span className="text-red-500">*</span>
              </Label>
              <div 
                onClick={() => thumbInputRef.current?.click()}
                className={`relative h-64 rounded-[2rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${formData.thumbnail ? 'border-primary/20 bg-black' : 'border-zinc-200 hover:border-primary/40 bg-zinc-50'}`}
              >
                {formData.thumbnail ? (
                  formData.mediaType === 'video' ? (
                    <video src={formData.thumbnail} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                  ) : (
                    <img src={formData.thumbnail} className="w-full h-full object-contain" alt="Thumbnail" />
                  )
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-3xl shadow-sm text-zinc-400 mb-3 flex gap-2">
                      <ImageIcon size={32} />
                      <Video size={32} />
                    </div>
                    <p className="font-black text-zinc-500 text-center">اسحب الصورة أو الفيديو هنا</p>
                    <p className="text-xs text-zinc-400 font-bold">بحد أقصى 50 ميجابايت</p>
                  </>
                )}
              </div>
              <input type="file" ref={thumbInputRef} className="hidden" accept="image/*,video/*" onChange={handleThumbnailChange} />
            </div>

            <div className="space-y-3 text-right">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground">الحد الأقصى: 600 كلمة (كتبت: {countWords(formData.description)})</span>
                <Label className="text-lg font-black flex items-center gap-2 justify-end">
                  وصف العمل <span className="text-red-500">*</span>
                </Label>
              </div>
              <Textarea 
                placeholder="وضح مهاراتك التي تظهر في هذا العمل..."
                className={`h-48 rounded-[2rem] border-2 p-6 text-lg font-medium leading-relaxed text-right ${countWords(formData.description) > 600 ? 'border-red-500' : ''}`}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-3 text-right">
              <Label className="text-lg font-black block">تاريخ الإنجاز</Label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  type="date"
                  className="h-14 pr-12 rounded-2xl border-2 font-bold text-right"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({...formData, completionDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-6 text-right">
              <div className="space-y-3">
                <Label className="text-lg font-black block">المهارات</Label>
                <Input 
                  placeholder="أضف المهارات..."
                  className="h-14 rounded-2xl border-2 font-bold text-right"
                  value={skillInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                />
              </div>

              <div className="p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-zinc-100 space-y-4">
                <h5 className="font-black text-sm text-zinc-500 uppercase tracking-widest text-right">مهارات مقترحة</h5>
                <div className="flex flex-wrap gap-2 justify-end">
                  {SUGGESTED_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 ${formData.skills.includes(skill) ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-zinc-600 border-zinc-200 hover:border-primary/40'}`}
                    >
                      {skill} {formData.skills.includes(skill) ? <X size={12} /> : <Plus size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-10 border-t-2 border-dashed space-y-6 text-right">
              <h5 className="text-xl font-black">تأكيد الملكية</h5>
              <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-3xl border-2 border-primary/10 justify-end">
                <Label htmlFor="agreed" className="text-lg font-bold leading-relaxed cursor-pointer select-none text-right flex-1">
                  أؤكد أن هذا العمل من مجهودي الشخصي ولا ينتهك حقوق الملكية <span className="text-red-500">*</span>
                </Label>
                <Checkbox 
                  id="agreed" 
                  checked={formData.agreed} 
                  onCheckedChange={(checked) => setFormData({...formData, agreed: !!checked})}
                  className="mt-1 h-6 w-6 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-20 rounded-[1.5rem] text-2xl font-black bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all"
              >
                {isSubmitting ? <><Loader2 className="ml-3 animate-spin" /> جاري الإرسال للمراجعة...</> : "إرسال العمل للمراجعة الآن"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
