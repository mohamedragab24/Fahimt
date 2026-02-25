
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
import { 
  Upload, 
  ImageIcon, 
  Loader2,
  Video,
  CloudUpload,
  Layers,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    categorySub: ""
  });

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const subCategories = allCategories?.filter(c => c.type === 'sub' && c.parentId === allCategories?.find(m => m.name === formData.category)?.id) || [];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'video') {
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
      } else {
        setThumbFile(file);
        setThumbPreview(URL.createObjectURL(file));
      }
    }
  };

  const upload = async (file: File, path: string) => {
    const sRef = ref(storage!, path);
    await uploadBytesResumable(sRef, file);
    return getDownloadURL(sRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !videoFile || !thumbFile || !formData.category) return;
    setIsSubmitting(true);
    try {
      const vUrl = await upload(videoFile, `portfolio/${user.uid}/v_${Date.now()}`);
      const tUrl = await upload(thumbFile, `portfolio/${user.uid}/t_${Date.now()}`);
      
      await addDoc(collection(firestore!, "portfolio"), {
        mufhemId: user.uid,
        ...formData,
        mediaUrl: vUrl,
        thumbnailUrl: tUrl,
        mediaType: "video",
        status: "pending_approval",
        createdAt: new Date().toISOString()
      });
      toast({ title: "تم الإرسال للمراجعة" });
      router.push("/portfolio");
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الرفع" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 mb-24 text-right" dir="rtl">
      <h1 className="text-4xl font-black">إضافة نموذج تفهيم</h1>
      <Card className="rounded-[3rem] border-2 shadow-2xl p-10 bg-white">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-2"><Label className="font-black">العنوان</Label><Input value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} className="h-14 rounded-xl border-2" required /></div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 text-right">
              <Label className="font-black">القسم</Label>
              <Select value={formData.category} onValueChange={(v)=>setFormData({...formData, category: v, categorySub: ""})}>
                <SelectTrigger className="h-14 rounded-xl border-2"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                <SelectContent>{mainCategories.map(c=><SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-right">
              <Label className="font-black">التخصص</Label>
              <Select disabled={!formData.category} value={formData.categorySub} onValueChange={(v)=>setFormData({...formData, categorySub: v})}>
                <SelectTrigger className="h-14 rounded-xl border-2"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                <SelectContent>{subCategories.map(c=><SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="font-black">الصورة المصغرة</Label>
              <div onClick={()=>thumbInputRef.current?.click()} className="h-48 rounded-3xl border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden">
                {thumbPreview ? <img src={thumbPreview} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-200" size={40}/>}
              </div>
              <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={(e)=>handleFile(e, 'image')} />
            </div>
            <div className="space-y-3">
              <Label className="font-black">فيديو الشرح</Label>
              <div onClick={()=>videoInputRef.current?.click()} className="h-48 rounded-3xl border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden">
                {videoPreview ? <video src={videoPreview} className="w-full h-full object-contain" muted /> : <Video className="text-zinc-200" size={40}/>}
              </div>
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e)=>handleFile(e, 'video')} />
            </div>
          </div>

          <div className="space-y-2"><Label className="font-black">الشرح التفصيلي</Label><Textarea value={formData.description} onChange={(e)=>setFormData({...formData, description: e.target.value})} className="h-40 rounded-2xl border-2" required /></div>
          <Button type="submit" disabled={isSubmitting} className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "نشر العمل للمراجعة"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
