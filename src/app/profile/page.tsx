
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Camera, 
  Lock, 
  Save, 
  User, 
  LogOut, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Upload, 
  BadgeCheck, 
  Smartphone, 
  FileText, 
  ImageIcon, 
  Trash2, 
  Layers, 
  Filter, 
  Activity,
  CheckCircle2,
  AlertCircle,
  IdCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";
import { Textarea } from "@/components/ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpMethod, setOtpMethod] = useState<'email' | 'whatsapp'>('email');

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading } = useDoc(userRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    birthDate: "",
    profilePictureUrl: "",
    specialization: "",
    bio: "",
    idCardFront: "",
    idCardBack: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phoneNumber || "",
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : "",
        profilePictureUrl: profile.profilePictureUrl || "",
        specialization: profile.specialization || "",
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
        toast({ title: "تم اختيار الملف بنجاح" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!userRef) return;
    updateDocumentNonBlocking(userRef, {
      ...formData,
      needsProfileCompletion: false,
      verificationStatus: formData.idCardFront && formData.idCardBack ? 'pending' : profile?.verificationStatus || null
    });
    toast({ title: "تم تحديث الملف الشخصي", description: "التغييرات ستظهر للمستخدمين فوراً." });
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري التحميل...</div>;
  if (!profile) return <div className="p-10 text-center">يرجى تسجيل الدخول.</div>;

  const verifiedBadgeUrl = settings?.verifiedBadgeUrl || PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12 mb-24" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black font-headline">الملف الشخصي والتوثيق</h1>
          <p className="text-muted-foreground text-lg">أكمل بياناتك المفقودة ووثق هويتك لزيادة الموثوقية.</p>
        </div>
        <Button variant="outline" onClick={() => signOut(auth).then(()=>router.push("/login"))} className="rounded-2xl h-14 border-2 font-bold">
          <LogOut className="ml-2" /> تسجيل خروج
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* معلومات الحساب الأساسية */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-2 rounded-[3rem] overflow-hidden bg-white">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/10"></div>
            <CardContent className="px-8 md:px-12 pb-12 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-10">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-40 w-40 border-8 border-white shadow-2xl">
                    <AvatarImage src={formData.profilePictureUrl} />
                    <AvatarFallback className="text-4xl font-black bg-zinc-100 text-zinc-400">ف</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-2 right-2 bg-primary p-3 rounded-2xl text-white shadow-xl border-4 border-white"><Camera size={20}/></div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'profilePictureUrl')} />
                </div>
                <div className="flex-1 text-center md:text-right space-y-2">
                  <h2 className="text-3xl font-black flex items-center justify-center md:justify-start gap-3">
                    {formData.fullName} 
                    {profile.isVerified && <img src={verifiedBadgeUrl} alt="V" className="h-8 w-8" />}
                  </h2>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="outline" className="px-4 py-1 text-primary font-black border-primary/20">{profile.role === 'mufhem' ? 'مفهم' : 'مستفهم'}</Badge>
                    {profile.isProfileApproved ? (
                      <Badge className="bg-green-100 text-green-600 border-none font-black flex items-center gap-1"><CheckCircle2 size={12}/> حساب معتمد</Badge>
                    ) : (
                      <Badge variant="destructive" className="animate-pulse">بانتظار مراجعة الإدارة للصور</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="font-black">الاسم الكامل</Label><Input value={formData.fullName} onChange={(e)=>setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-xl border-2 font-bold" /></div>
                <div className="space-y-2"><Label className="font-black">رقم الهاتف</Label><Input value={formData.phone} disabled className="h-14 rounded-xl border-2 font-black opacity-60" /></div>
                <div className="space-y-2"><Label className="font-black">البريد الإلكتروني</Label><Input value={profile.email} disabled className="h-14 rounded-xl border-2 font-bold opacity-60" /></div>
                <div className="space-y-2"><Label className="font-black">تاريخ الميلاد</Label><Input type="date" value={formData.birthDate} onChange={(e)=>setFormData({...formData, birthDate: e.target.value})} className="h-14 rounded-xl border-2 font-bold" /></div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-black">نبذة تعريفية</Label>
                  <Textarea value={formData.bio} onChange={(e)=>setFormData({...formData, bio: e.target.value})} className="h-32 rounded-xl border-2 p-4 text-lg font-medium" placeholder="اكتب شيئاً عنك للآخرين..." />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full h-16 mt-8 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">حفظ وتحديث الملف</Button>
            </CardContent>
          </Card>
        </div>

        {/* قسم توثيق الهوية (البطاقة) */}
        <div className="space-y-8">
          <Card className="shadow-2xl border-2 rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-900 text-white p-8">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <IdCard className="text-primary" /> توثيق الهوية الرسمية
              </CardTitle>
              <CardDescription className="text-zinc-400 font-bold">ارفع صورة البطاقة الشخصية للفصل في النزاعات المالية.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="font-black block text-right">صورة البطاقة (الوجه الأمامي)</Label>
                <div 
                  onClick={() => idFrontRef.current?.click()}
                  className="h-40 rounded-[2rem] border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/20 transition-all"
                >
                  {formData.idCardFront ? <img src={formData.idCardFront} className="w-full h-full object-cover" /> : <Upload className="text-zinc-300" size={32} />}
                </div>
                <input type="file" ref={idFrontRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'idCardFront')} />
              </div>

              <div className="space-y-4">
                <Label className="font-black block text-right">صورة البطاقة (الظهر)</Label>
                <div 
                  onClick={() => idBackRef.current?.click()}
                  className="h-40 rounded-[2rem] border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/20 transition-all"
                >
                  {formData.idCardBack ? <img src={formData.idCardBack} className="w-full h-full object-cover" /> : <Upload className="text-zinc-300" size={32} />}
                </div>
                <input type="file" ref={idBackRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'idCardBack')} />
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl flex items-start gap-3 border border-orange-100">
                <AlertCircle className="text-orange-600 shrink-0 mt-1" size={18} />
                <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                  تنبيه: يتم التحقق من الصور الشخصية وصورة الهوية من قبل إدارة المنصة لضمان مطابقتها للواقع. قد يستغرق التوثيق 24 ساعة.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 bg-primary/5 rounded-[3rem] border-2 border-dashed border-primary/20 space-y-4">
            <h4 className="font-black text-primary flex items-center gap-2"><CheckCircle2 size={20}/> مميزات الحساب الموثق</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-600">
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> سحب الأرباح الفوري</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> شارة التوثيق الزرقاء</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> أولوية الظهور في البحث</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
