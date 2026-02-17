
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Lock, Save, User, LogOut, Phone, Calendar as CalendarIcon, Mail, ShieldCheck, Upload, Copy, Check, Fingerprint, GraduationCap, BadgeCheck, Smartphone, FileText, Image as ImageIcon, Trash2, Plus, Video, PlayCircle, Layers, MessageSquare, Filter, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase, useCollection } from "@/firebase";
import { doc, collection, addDoc, query, where, orderBy, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
    specializationSub: "",
    specializationOption: "",
    bio: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phoneNumber || "",
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : "",
        profilePictureUrl: profile.profilePictureUrl || "",
        specialization: profile.specialization || "",
        specializationSub: profile.specializationSub || "",
        specializationOption: profile.specializationOption || "",
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const subCategories = allCategories?.filter(c => c.type === 'sub' && c.parentId === allCategories?.find(m => m.name === formData.specialization)?.id) || [];
  const options = allCategories?.filter(c => c.type === 'option' && c.parentId === allCategories?.find(s => s.name === formData.specializationSub)?.id) || [];

  const handleSendOTP = async (method: 'email' | 'whatsapp') => {
    const recipient = method === 'email' ? user?.email : formData.phone;
    if (!recipient) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى التأكد من البريد أو الهاتف." });
      return;
    }
    
    setIsSendingOtp(true);
    setOtpMethod(method);
    try {
      const result = await generateAndSendOTP({ recipient, method });
      if (result.success) {
        setGeneratedCode(result.code);
        setShowOtpDialog(true);
        toast({ title: "تم إرسال الرمز", description: `تحقق من ${method === 'email' ? 'بريدك' : 'الواتساب'}.` });
      } else {
        toast({ variant: "destructive", title: "خطأ", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ فني" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = () => {
    if (otpCode === generatedCode && userRef) {
      const field = otpMethod === 'email' ? 'emailVerified' : 'whatsappVerified';
      updateDocumentNonBlocking(userRef, { [field]: true });
      setShowOtpDialog(false);
      setOtpCode("");
      toast({ title: "تم التوثيق بنجاح!" });
    } else {
      toast({ variant: "destructive", title: "رمز خاطئ" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePictureUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!userRef) return;
    updateDocumentNonBlocking(userRef, {
      fullName: formData.fullName,
      phoneNumber: formData.phone,
      birthDate: formData.birthDate,
      profilePictureUrl: formData.profilePictureUrl,
      specialization: formData.specialization,
      specializationSub: formData.specializationSub,
      specializationOption: formData.specializationOption,
      bio: formData.bio
    });
    toast({ title: "تم التحديث", description: "تم حفظ التغييرات بنجاح." });
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري تحميل البيانات...</div>;
  if (!profile) return <div className="p-10 text-center font-bold">يرجى تسجيل الدخول لعرض الملف الشخصي.</div>;

  const verifiedBadgeUrl = settings?.verifiedBadgeUrl || PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight">الملف الشخصي</h1>
          <p className="text-muted-foreground text-lg">إدارة بياناتك والتحقق من وسائل التواصل.</p>
        </div>
        <Button variant="outline" onClick={() => signOut(auth).then(()=>router.push("/login"))} className="rounded-2xl h-14 border-2 font-bold px-8">
          <LogOut className="ml-2" /> خروج
        </Button>
      </div>

      <Card className="shadow-2xl border-2 rounded-[3rem] overflow-hidden bg-white">
        <div className="h-40 bg-gradient-to-r from-primary/20 to-accent/10 relative"></div>
        <CardContent className="px-8 md:px-16 pb-16 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-20 mb-12">
            <div className="relative group">
              <Avatar className="h-44 w-44 border-8 border-white shadow-2xl">
                <AvatarImage src={formData.profilePictureUrl} />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{formData.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 rounded-2xl h-12 w-12 shadow-xl border-4 border-white bg-primary"><Upload size={20}/></Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-right">
              <h2 className="text-3xl md:text-4xl font-black flex items-center justify-center md:justify-start gap-3">
                {formData.fullName} 
                {(profile.isVerified || profile.emailVerified || profile.whatsappVerified) && (
                  <img src={verifiedBadgeUrl} alt="Verified" className="h-10 w-10" />
                )}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className="px-4 py-1 text-md font-black">{profile.role === 'mufhem' ? 'مُفهم معتمد' : 'مُستفهم طموح'}</Badge>
                {profile.emailVerified && <Badge className="bg-green-100 text-green-600 border-none flex items-center gap-1"><Check size={12}/> بريد موثق</Badge>}
                {profile.whatsappVerified && <Badge className="bg-blue-100 text-blue-600 border-none flex items-center gap-1"><MessageSquare size={12}/> واتساب موثق</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="font-black text-lg">الاسم الكامل</Label>
              <Input value={formData.fullName} onChange={(e)=>setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="font-black text-lg">رقم الهاتف (واتساب)</Label>
              <div className="flex gap-2">
                <Input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="h-14 rounded-xl border-2 font-bold flex-1" />
                {!profile.whatsappVerified && (
                  <Button onClick={() => handleSendOTP('whatsapp')} disabled={isSendingOtp} variant="outline" className="h-14 rounded-xl border-2 font-black text-blue-600 border-blue-200 bg-blue-50">توثيق الرقم</Button>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="font-black text-lg">البريد الإلكتروني</Label>
              <div className="flex gap-2">
                <Input value={user?.email || ""} disabled className="h-14 rounded-xl border-2 font-bold flex-1 opacity-60" />
                {!profile.emailVerified && (
                  <Button onClick={() => handleSendOTP('email')} disabled={isSendingOtp} variant="outline" className="h-14 rounded-xl border-2 font-black text-green-600 border-green-200 bg-green-50">توثيق البريد</Button>
                )}
              </div>
            </div>

            {profile.role === 'mufhem' && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-8">
                <div className="space-y-3">
                  <Label className="font-black text-lg flex items-center gap-2">القسم الرئيسي <Layers size={16}/></Label>
                  <Select value={formData.specialization} onValueChange={(v) => setFormData({...formData, specialization: v, specializationSub: "", specializationOption: ""})}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent>
                      {mainCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                      <SelectItem value="أخرى" className="font-bold text-primary italic">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-lg flex items-center gap-2">التخصص <Filter size={16}/></Label>
                  <Select disabled={!formData.specialization || formData.specialization === 'أخرى'} value={formData.specializationSub} onValueChange={(v) => setFormData({...formData, specializationSub: v, specializationOption: ""})}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                    <SelectContent>
                      {subCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                      <SelectItem value="أخرى" className="font-bold text-primary italic">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-lg flex items-center gap-2">مهارة محددة <Activity size={16}/></Label>
                  <Select disabled={!formData.specializationSub || formData.specializationSub === 'أخرى'} value={formData.specializationOption} onValueChange={(v) => setFormData({...formData, specializationOption: v})}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue placeholder="اختر المهارة" /></SelectTrigger>
                    <SelectContent>
                      {options.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                      <SelectItem value="أخرى" className="font-bold text-primary italic">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="md:col-span-2 space-y-3">
              <Label className="font-black text-lg">نبذة تعريفية للطلاب</Label>
              <Textarea value={formData.bio} onChange={(e)=>setFormData({...formData, bio: e.target.value})} className="h-32 rounded-xl border-2 p-4 text-lg font-medium" />
            </div>
          </div>

          <div className="mt-12 flex justify-center md:justify-end">
            <Button onClick={handleSave} className="h-16 px-12 rounded-2xl font-black text-xl shadow-xl"><Save className="ml-2" /> حفظ التعديلات</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black">رمز التحقق</DialogTitle>
            <DialogDescription className="text-right font-bold">أدخل الرمز المكون من 6 أرقام لتأكيد {otpMethod === 'email' ? 'البريد' : 'الواتساب'}.</DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-6">
            <Input maxLength={6} className="h-20 text-5xl font-black tracking-[0.5em] text-center rounded-[2rem] border-4 border-primary/20" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            <Button onClick={handleVerifyOTP} className="w-full h-16 text-xl font-black rounded-2xl shadow-lg">تأكيد الرمز الآن</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
