
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
  IdCard,
  Clock,
  Loader2,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ProfilePage() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);

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
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "الملف كبير جداً", description: "يرجى اختيار صورة أقل من 1MB لضمان سرعة التحميل." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        toast({ title: "تم اختيار الملف بنجاح", description: "يرجى الضغط على حفظ لإرساله للمراجعة." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userRef) return;
    setIsSaving(true);
    
    // التحقق من التغييرات التي تتطلب مراجعة إدارية
    const pictureChanged = formData.profilePictureUrl !== profile?.profilePictureUrl && formData.profilePictureUrl !== "";
    const idChanged = (formData.idCardFront && formData.idCardFront !== profile?.idCardFront) || 
                      (formData.idCardBack && formData.idCardBack !== profile?.idCardBack);

    const updateData: any = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    // إذا تغيرت الصورة، نضعها في حالة "انتظار المراجعة" ونعلم المسؤول
    if (pictureChanged) {
      updateData.isProfileApproved = false;
      updateData.profilePicturePending = true;
    }

    // إذا تغيرت البطاقة، نضع التوثيق في حالة "انتظار"
    if (idChanged) {
      updateData.verificationStatus = 'pending';
    }

    try {
      updateDocumentNonBlocking(userRef, updateData);
      toast({ title: "تم إرسال التحديثات للمراجعة", description: "سيقوم فريق فهمت بمراجعة التغييرات خلال 24 ساعة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الحفظ" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black text-2xl">جاري تحميل بياناتك...</div>;
  if (!profile) return <div className="p-20 text-center font-bold">يرجى تسجيل الدخول للوصول لهذه الصفحة.</div>;

  const verifiedBadgeUrl = settings?.verifiedBadgeUrl || PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 mb-24" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black font-headline">إدارة الملف الشخصي</h1>
          <p className="text-muted-foreground text-lg font-bold">حافظ على ملفك الشخصي محدثاً ووثق هويتك لتكسب ثقة المجتمع.</p>
        </div>
        <Button variant="outline" onClick={() => signOut(auth).then(()=>router.push("/login"))} className="rounded-2xl h-14 border-2 font-bold text-red-600 border-red-100 hover:bg-red-50">
          <LogOut className="ml-2" /> تسجيل خروج
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-2 rounded-[3.5rem] overflow-hidden bg-white">
            <div className="h-40 bg-gradient-to-r from-primary/30 via-primary/10 to-accent/10 relative">
              {profile.profilePicturePending && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black animate-pulse shadow-lg flex items-center gap-2">
                  <Clock size={12}/> الصورة قيد المراجعة الإدارية
                </div>
              )}
            </div>
            <CardContent className="px-8 md:px-12 pb-12 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-20 mb-12">
                <div className="relative group">
                  <div className="h-44 w-44 rounded-full border-[10px] border-white shadow-2xl overflow-hidden bg-zinc-100">
                    <img src={formData.profilePictureUrl || "https://placehold.co/200x200?text=F"} className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-primary p-4 rounded-2xl text-white shadow-xl border-4 border-white hover:scale-110 transition-transform"
                  >
                    <Camera size={24}/>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'profilePictureUrl')} />
                </div>
                <div className="flex-1 text-center md:text-right space-y-3">
                  <h2 className="text-4xl font-black flex items-center justify-center md:justify-start gap-3">
                    {formData.fullName} 
                    {profile.isVerified && <img src={verifiedBadgeUrl} alt="V" className="h-10 w-10 drop-shadow-md" />}
                  </h2>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge variant="outline" className="px-6 py-1.5 text-md text-primary font-black border-primary/20 bg-primary/5 rounded-xl">{profile.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
                    {profile.isProfileApproved ? (
                      <Badge className="bg-green-100 text-green-600 border-none font-black flex items-center gap-2 px-4 py-1.5 rounded-xl"><CheckCircle2 size={14}/> صورة معتمدة</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-600 border-none font-black flex items-center gap-2 px-4 py-1.5 rounded-xl animate-pulse"><Clock size={14}/> قيد التدقيق</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="font-black text-zinc-500 mr-2">الاسم الكامل</Label>
                  <Input value={formData.fullName} onChange={(e)=>setFormData({...formData, fullName: e.target.value})} className="h-16 rounded-2xl border-2 font-black text-xl px-6 focus:ring-primary/20" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-zinc-500 mr-2">رقم الهاتف</Label>
                  <Input value={formData.phone} disabled className="h-16 rounded-2xl border-2 font-black text-xl px-6 bg-zinc-50 opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-zinc-500 mr-2">البريد الإلكتروني</Label>
                  <Input value={profile.email} disabled className="h-16 rounded-2xl border-2 font-black text-xl px-6 bg-zinc-50 opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-zinc-500 mr-2">تاريخ الميلاد</Label>
                  <Input type="date" value={formData.birthDate} onChange={(e)=>setFormData({...formData, birthDate: e.target.value})} className="h-16 rounded-2xl border-2 font-black text-xl px-6" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label className="font-black text-zinc-500 mr-2">نبذة تعريفية (تظهر للآخرين)</Label>
                  <Textarea value={formData.bio} onChange={(e)=>setFormData({...formData, bio: e.target.value})} className="h-40 rounded-[2rem] border-2 p-6 text-xl font-medium leading-relaxed" placeholder="اكتب شيئاً عن خبراتك وأسلوبك في الشرح..." />
                </div>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full h-20 mt-12 rounded-[2rem] font-black text-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                {isSaving ? <><Loader2 className="animate-spin ml-3 h-8 w-8" /> جاري الحفظ...</> : "حفظ وتحديث الملف الشخصي"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-2xl border-2 rounded-[3.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-900 text-white p-8 space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <IdCard className="text-primary" /> توثيق الهوية
                </CardTitle>
                {profile.verificationStatus === 'verified' && <BadgeCheck className="text-primary h-8 w-8" />}
              </div>
              <CardDescription className="text-zinc-400 font-bold text-sm">ارفع صورة البطاقة الشخصية (وجه وظهر) للحصول على شارة التوثيق الزرقاء وسحب أرباحك فوراً.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {profile.verificationStatus === 'verified' ? (
                <div className="bg-green-50 p-8 rounded-[2rem] border-2 border-dashed border-green-200 text-center space-y-4">
                  <CheckCircle2 size={64} className="text-green-600 mx-auto" />
                  <h4 className="text-2xl font-black text-green-900">هويتك موثقة بنجاح</h4>
                  <p className="text-green-700 font-bold text-sm">أنت الآن خبير معتمد في منصة فهمت.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="font-black text-sm">البطاقة الشخصية (الوجه)</Label>
                      {profile.verificationStatus === 'pending' && <Badge className="bg-orange-500 text-[8px] h-4">بانتظار المراجعة</Badge>}
                    </div>
                    <div 
                      onClick={() => idFrontRef.current?.click()}
                      className="h-44 rounded-[2.5rem] border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/30 transition-all relative group"
                    >
                      {formData.idCardFront ? (
                        <img src={formData.idCardFront} className="w-full h-full object-cover group-hover:opacity-50" />
                      ) : (
                        <div className="text-center space-y-2"><Upload className="text-zinc-200 mx-auto" size={40} /><p className="text-[10px] font-black text-zinc-300">ارفع الوجه الأمامي</p></div>
                      )}
                    </div>
                    <input type="file" ref={idFrontRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'idCardFront')} />
                  </div>

                  <div className="space-y-4">
                    <Label className="font-black text-sm block">البطاقة الشخصية (الظهر)</Label>
                    <div 
                      onClick={() => idBackRef.current?.click()}
                      className="h-44 rounded-[2.5rem] border-4 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/30 transition-all relative group"
                    >
                      {formData.idCardBack ? (
                        <img src={formData.idCardBack} className="w-full h-full object-cover group-hover:opacity-50" />
                      ) : (
                        <div className="text-center space-y-2"><Upload className="text-zinc-200 mx-auto" size={40} /><p className="text-[10px] font-black text-zinc-300">ارفع الوجه الخلفي</p></div>
                      )}
                    </div>
                    <input type="file" ref={idBackRef} className="hidden" accept="image/*" onChange={(e)=>handleFileUpload(e, 'idCardBack')} />
                  </div>

                  <div className="p-5 bg-orange-50 rounded-2xl flex items-start gap-4 border border-orange-100 shadow-inner">
                    <AlertCircle className="text-orange-600 shrink-0 mt-1" size={24} />
                    <p className="text-[11px] font-bold text-orange-800 leading-relaxed">
                      تنبيه: مراجعة وثائق الهوية تتم يدوياً من قبل الإدارة لضمان الأمان المالي. لن تظهر هذه الصور لأي مستخدم آخر.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="p-10 bg-primary/5 rounded-[3rem] border-2 border-dashed border-primary/20 space-y-6">
            <h4 className="font-black text-primary text-xl flex items-center gap-3"><BadgeCheck size={28}/> مزايا التوثيق</h4>
            <ul className="space-y-4">
              <FeatureItem text="شارة التوثيق الزرقاء الرسمية" />
              <FeatureItem text="سحب الأرباح فورياً بدون انتظار" />
              <FeatureItem text="أولوية ظهور استفهاماتك وعروضك" />
              <FeatureItem text="زيادة ثقة الطلاب في أسلوب شرحك" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm font-bold text-zinc-600">
      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
      <span>{text}</span>
    </li>
  );
}
