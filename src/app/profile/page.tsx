
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Camera, 
  LogOut, 
  ShieldCheck, 
  Upload, 
  CheckCircle2,
  Clock,
  Loader2,
  IdCard,
  AlertCircle,
  Smartphone,
  UserCheck,
  User as UserIcon,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ProfilePage() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const facePhotoRef = useRef<HTMLInputElement>(null);
  const selfieFrontRef = useRef<HTMLInputElement>(null);
  const selfieBackRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingId, setIsVerifyingId] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, "users", user.uid) : null, [firestore, user?.uid]);
  const { data: profile, isLoading } = useDoc(userRef);

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    profilePictureUrl: "",
    bio: "",
    phoneNumber: "",
    // بيانات توثيق الهوية
    idFullName: "",
    idGender: "male",
    idBirthDate: "",
    idCardFront: "",
    idCardBack: "",
    facePhoto: "",
    selfieIdFront: "",
    selfieIdBack: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : "",
        profilePictureUrl: profile.profilePicturePending ? profile.pendingProfilePictureUrl : (profile.profilePictureUrl || ""),
        bio: profile.bio || "",
        phoneNumber: profile.phoneNumber || "",
        idFullName: profile.idFullName || profile.fullName || "",
        idGender: profile.idGender || profile.gender || "male",
        idBirthDate: profile.idBirthDate || (profile.birthDate ? profile.birthDate.split('T')[0] : ""),
        idCardFront: profile.idCardFront || "",
        idCardBack: profile.idCardBack || "",
        facePhoto: profile.facePhoto || "",
        selfieIdFront: profile.selfieIdFront || "",
        selfieIdBack: profile.selfieIdBack || ""
      });
    }
  }, [profile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBasic = async () => {
    if (!userRef || !profile) return;
    setIsSaving(true);
    try {
      const updateData: any = {
        fullName: formData.fullName,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
        updatedAt: new Date().toISOString(),
        needsProfileCompletion: false
      };
      
      const currentOfficial = profile.profilePictureUrl || "";
      const currentPending = profile.pendingProfilePictureUrl || "";
      
      // إذا تغيرت الصورة، نضعها في الحقل المنتظر للمراجعة
      if (formData.profilePictureUrl && formData.profilePictureUrl !== (profile.profilePicturePending ? currentPending : currentOfficial)) {
        updateData.pendingProfilePictureUrl = formData.profilePictureUrl;
        updateData.profilePicturePending = true;
      }

      await updateDoc(userRef, updateData);
      toast({ title: "تم حفظ التغييرات", description: "سيتم مراجعة الصورة الشخصية من قبل الإدارة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الحفظ" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleIdVerificationSubmit = async () => {
    if (!userRef || !profile) return;
    if (!formData.idCardFront || !formData.idCardBack || !formData.facePhoto || !formData.selfieIdFront || !formData.selfieIdBack) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى رفع كافة المستندات المطلوبة للتوثيق." });
      return;
    }

    setIsVerifyingId(true);
    try {
      await updateDoc(userRef, {
        idFullName: formData.idFullName,
        idGender: formData.idGender,
        idBirthDate: formData.idBirthDate,
        idCardFront: formData.idCardFront,
        idCardBack: formData.idCardBack,
        facePhoto: formData.facePhoto,
        selfieIdFront: formData.selfieIdFront,
        selfieIdBack: formData.selfieIdBack,
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date().toISOString()
      });
      toast({ title: "تم إرسال طلب التوثيق", description: "سيقوم فريق الإدارة بمراجعة مستنداتك قريباً." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال طلب التوثيق." });
    } finally {
      setIsVerifyingId(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse">جاري تحميل بياناتك...</div>;

  const defaultAvatar = profile?.gender === 'female' 
    ? "https://picsum.photos/seed/female/200/200" 
    : "https://picsum.photos/seed/male/200/200";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-24 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 border-primary pr-6">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black font-headline text-zinc-900">الملف الشخصي</h1>
          {profile?.isVerified && <ShieldCheck className="h-10 w-10 text-blue-500" />}
        </div>
        <Button variant="outline" onClick={() => signOut(auth).then(()=>router.push("/login"))} className="rounded-xl h-12 font-bold text-red-600 border-red-100">
          <LogOut className="ml-2" /> تسجيل خروج
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* المربع الأساسي - البيانات العامة */}
        <Card className="shadow-2xl border-2 rounded-[3.5rem] overflow-hidden bg-white">
          <div className="h-32 bg-primary/10"></div>
          <CardContent className="px-8 md:px-12 pb-12 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-16 mb-12">
              <div className="relative">
                <div className="h-40 w-40 rounded-full border-[8px] border-white shadow-xl overflow-hidden bg-zinc-100">
                  <img src={formData.profilePictureUrl || defaultAvatar} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-primary p-3 rounded-xl text-white shadow-lg border-2 border-white">
                  <Camera size={20}/>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'profilePictureUrl')} />
              </div>
              <div className="flex-1 text-center md:text-right">
                <h2 className="text-3xl font-black flex items-center justify-center md:justify-start gap-2">
                  {formData.fullName}
                  {profile?.isVerified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
                </h2>
                <Badge variant="outline" className="mt-2 text-primary font-bold">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
              </div>
            </div>

            {profile?.profilePicturePending && (
              <div className="bg-orange-50 p-4 rounded-xl flex items-center gap-3 text-orange-700 font-black text-xs border border-orange-100 mb-8">
                <Clock size={16} className="shrink-0 animate-pulse" />
                <span>صورتك الشخصية الجديدة قيد المراجعة حالياً. ستظهر للآخرين فور اعتمادها.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="font-black">الاسم بالكامل</Label>
                <Input value={formData.fullName} onChange={(e)=>setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-xl border-2" />
              </div>
              <div className="space-y-2">
                <Label className="font-black">تاريخ الميلاد</Label>
                <Input type="date" value={formData.birthDate} onChange={(e)=>setFormData({...formData, birthDate: e.target.value})} className="h-14 rounded-xl border-2" />
              </div>
              <div className="space-y-2">
                <Label className="font-black">رقم الهاتف</Label>
                <div className="flex gap-2">
                  <Input value={formData.phoneNumber} onChange={(e)=>setFormData({...formData, phoneNumber: e.target.value})} className="h-14 rounded-xl border-2 font-mono" dir="ltr" />
                  <Button variant="outline" className="h-14 rounded-xl font-bold border-primary text-primary">توثيق الرقم</Button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-black">نبذة تعريفية</Label>
                <Textarea value={formData.bio} onChange={(e)=>setFormData({...formData, bio: e.target.value})} className="h-32 rounded-xl border-2" placeholder="اشرح مهاراتك أو ما تبحث عنه..." />
              </div>
            </div>
            <Button onClick={handleSaveBasic} disabled={isSaving} className="w-full h-16 mt-10 rounded-2xl font-black text-xl shadow-xl">
              {isSaving ? <Loader2 className="animate-spin ml-2" /> : "حفظ التغييرات العامة"}
            </Button>
          </CardContent>
        </Card>

        {/* المربع الثاني - توثيق الهوية (إرسال للإدارة فقط) */}
        <Card className="shadow-2xl border-2 rounded-[3.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-zinc-900 text-white p-10">
            <CardTitle className="text-3xl font-black flex items-center gap-3">
              <IdCard className="text-primary h-10 w-10" /> طلب توثيق الهوية الرسمية
            </CardTitle>
            <CardDescription className="text-zinc-400 font-bold text-lg mt-4 leading-relaxed">
              جميع البيانات والمستندات التي تقوم برفعها هنا لن تعرض على ملفك الشخصى وسيتم إرسالها للإدارة فقط لمراجعتها.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="font-black flex items-center gap-2">الاسم بالكامل كما في البطاقة <UserIcon size={14}/></Label>
                <Input value={formData.idFullName} onChange={(e)=>setFormData({...formData, idFullName: e.target.value})} className="h-14 rounded-xl border-2" />
              </div>
              <div className="space-y-2">
                <Label className="font-black flex items-center gap-2">تاريخ الميلاد <Calendar size={14}/></Label>
                <Input type="date" value={formData.idBirthDate} onChange={(e)=>setFormData({...formData, idBirthDate: e.target.value})} className="h-14 rounded-xl border-2" />
              </div>
              <div className="space-y-2">
                <Label className="font-black">الجنس</Label>
                <RadioGroup value={formData.idGender} onValueChange={(v)=>setFormData({...formData, idGender: v})} className="flex gap-6 pt-4">
                  <div className="flex items-center gap-2"><RadioGroupItem value="male" id="m" /><Label htmlFor="m" className="font-bold">ذكر</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="female" id="f" /><Label htmlFor="f" className="font-bold">أنثى</Label></div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 border-t border-dashed">
              <UploadBox label="صورة البطاقة (أمام)" value={formData.idCardFront} onClick={()=>idFrontRef.current?.click()} />
              <input type="file" ref={idFrontRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'idCardFront')} />
              
              <UploadBox label="صورة البطاقة (خلف)" value={formData.idCardBack} onClick={()=>idBackRef.current?.click()} />
              <input type="file" ref={idBackRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'idCardBack')} />
              
              <UploadBox label="صورة شخصية واضحة للوجه" value={formData.facePhoto} onClick={()=>facePhotoRef.current?.click()} />
              <input type="file" ref={facePhotoRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'facePhoto')} />
              
              <UploadBox label="سيلفي مع البطاقة (أمام)" value={formData.selfieIdFront} onClick={()=>selfieFrontRef.current?.click()} sub="يجب أن يكون وجهك وبيانات البطاقة واضحة" />
              <input type="file" ref={selfieFrontRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'selfieIdFront')} />
              
              <UploadBox label="سيلفي مع البطاقة (خلف)" value={formData.selfieIdBack} onClick={()=>selfieBackRef.current?.click()} sub="يجب أن يكون وجهك وبيانات البطاقة واضحة" />
              <input type="file" ref={selfieBackRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'selfieIdBack')} />
            </div>

            <div className="p-6 bg-blue-50 rounded-2xl flex items-start gap-4 border-2 border-dashed border-blue-200">
              <AlertCircle className="text-blue-600 shrink-0" />
              <p className="text-sm font-bold text-blue-800 leading-relaxed">
                تنبيه: يشترط في صور السيلفي أن يكون الوجه واضحاً تماماً وبيانات بطاقة الهوية مقروءة بوضوح للفصل والتوثيق.
              </p>
            </div>

            <Button onClick={handleIdVerificationSubmit} disabled={isVerifyingId || profile?.verificationStatus === 'pending'} className="w-full h-20 rounded-[2rem] font-black text-2xl bg-zinc-900 shadow-xl hover:scale-[1.02] transition-all">
              {isVerifyingId ? <Loader2 className="animate-spin ml-2" /> : (profile?.verificationStatus === 'pending' ? <><Clock className="ml-2"/> طلبك قيد المراجعة</> : <><UserCheck className="ml-2"/> إرسال المستندات للمراجعة</>)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UploadBox({ label, value, onClick, sub }: any) {
  return (
    <div className="space-y-3">
      <Label className="font-black text-xs opacity-70">{label}</Label>
      <div onClick={onClick} className="h-48 rounded-[2rem] border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary transition-all relative">
        {value ? (
          <img src={value} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center space-y-2">
            <Upload className="mx-auto text-zinc-200" size={32} />
            <p className="text-[10px] font-black text-zinc-400">اضغط للرفع</p>
          </div>
        )}
      </div>
      {sub && <p className="text-[9px] text-zinc-400 font-bold text-center leading-tight">{sub}</p>}
    </div>
  );
}
