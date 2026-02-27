
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Camera, 
  LogOut, 
  ShieldCheck, 
  Upload, 
  BadgeCheck, 
  CheckCircle2,
  Clock,
  Loader2,
  IdCard,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ProfilePage() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading } = useDoc(userRef);

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    profilePictureUrl: "",
    bio: "",
    idCardFront: "",
    idCardBack: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : "",
        profilePictureUrl: profile.profilePictureUrl || "",
        bio: profile.bio || "",
        idCardFront: profile.idCardFront || "",
        idCardBack: profile.idCardBack || ""
      });
    }
  }, [profile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePictureUrl' | 'idCardFront' | 'idCardBack') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userRef) return;
    setIsSaving(true);
    try {
      const updateData: any = {
        ...formData,
        updatedAt: new Date().toISOString(),
        needsProfileCompletion: false
      };
      
      // إذا تم تغيير الصور، نحتاج مراجعة الإدارة
      if (formData.profilePictureUrl !== profile?.profilePictureUrl) updateData.isProfileApproved = false;
      if (formData.idCardFront !== profile?.idCardFront) updateData.verificationStatus = 'pending';

      await updateDoc(userRef, updateData);
      toast({ title: "تم التحديث بنجاح", description: "سيقوم فريق فهمت بمراجعة التغييرات." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الحفظ" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black">جاري تحميل بياناتك...</div>;

  const defaultAvatar = profile?.gender === 'female' 
    ? "https://picsum.photos/seed/female/200/200" 
    : "https://picsum.photos/seed/male/200/200";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-24" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إكمال بيانات الملف الشخصي</h1>
        <Button variant="outline" onClick={() => signOut(auth).then(()=>router.push("/login"))} className="rounded-xl h-12 font-bold text-red-600 border-red-100">
          <LogOut className="ml-2" /> خروج
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-2 rounded-[3.5rem] overflow-hidden bg-white">
            <div className="h-32 bg-primary/10"></div>
            <CardContent className="px-8 md:px-12 pb-12 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-16 mb-12">
                <div className="relative">
                  <div className="h-40 w-44 rounded-full border-[8px] border-white shadow-xl overflow-hidden bg-zinc-100">
                    <img src={formData.profilePictureUrl || defaultAvatar} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-primary p-3 rounded-xl text-white shadow-lg border-2 border-white">
                    <Camera size={20}/>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'profilePictureUrl')} />
                </div>
                <div className="flex-1 text-center md:text-right">
                  <h2 className="text-3xl font-black">{formData.fullName}</h2>
                  <Badge variant="outline" className="mt-2 text-primary font-bold">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><Label className="font-black">الاسم الكامل</Label><Input value={formData.fullName} onChange={(e)=>setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-xl border-2" /></div>
                <div className="space-y-2"><Label className="font-black">تاريخ الميلاد</Label><Input type="date" value={formData.birthDate} onChange={(e)=>setFormData({...formData, birthDate: e.target.value})} className="h-14 rounded-xl border-2" /></div>
                <div className="md:col-span-2 space-y-2"><Label className="font-black">نبذة تعريفية</Label><Textarea value={formData.bio} onChange={(e)=>setFormData({...formData, bio: e.target.value})} className="h-32 rounded-xl border-2" placeholder="اشرح مهاراتك أو ما تبحث عنه..." /></div>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-16 mt-10 rounded-2xl font-black text-xl shadow-xl">
                {isSaving ? <Loader2 className="animate-spin ml-2" /> : "حفظ التغييرات"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-2xl border-2 rounded-[3.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-900 text-white p-8">
              <CardTitle className="text-xl font-black flex items-center gap-2"><ShieldCheck className="text-primary" /> توثيق الهوية</CardTitle>
              <CardDescription className="text-zinc-400 font-bold">ارفع صورة البطاقة الشخصية للحصول على شارة التوثيق.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="font-black">الوجه الأمامي (Front)</Label>
                <div onClick={()=>idFrontRef.current?.click()} className="h-40 rounded-2xl border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden">
                  {formData.idCardFront ? <img src={formData.idCardFront} className="w-full h-full object-cover" /> : <Upload className="text-zinc-200" size={32} />}
                </div>
                <input type="file" ref={idFrontRef} className="hidden" onChange={(e)=>handleFileUpload(e, 'idCardFront')} />
              </div>
              <div className="space-y-4">
                <Label className="font-black">الوجه الخلفي (Back)</Label>
                <div onClick={()=>idBackRef.current?.click()} className="h-40 rounded-2xl border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden">
                  {formData.idCardBack ? <img src={formData.idCardBack} className="w-full h-full object-cover" /> : <Upload className="text-zinc-200" size={32} />}
                </div>
                <input type="file" ref={idBackRef} className="hidden" onChange={(e)=>handleFileUpload(e, 'idCardBack')} />
              </div>
              {profile?.isVerified && (
                <div className="bg-green-50 p-4 rounded-xl flex items-center gap-2 text-green-700 font-black text-xs">
                  <CheckCircle2 size={16} /> تم التحقق من صورة الهوية الشخصية بنجاح
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
