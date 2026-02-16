
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Lock, Save, User, LogOut, Phone, Calendar as CalendarIcon, Mail, ShieldCheck, Upload, Copy, Check, Fingerprint, GraduationCap, BadgeCheck, Smartphone, FileText, Image as ImageIcon, Trash2, Plus, Video, PlayCircle, Layers } from "lucide-react";
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
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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

  const portfolioQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "portfolio"), where("mufhemId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [firestore, user?.uid]);

  const { data: portfolioItems } = useCollection(portfolioQuery);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    birthDate: "",
    profilePictureUrl: "",
    specialization: "",
    specializationSub: "",
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
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  const handleSendOTP = async () => {
    if (!user?.email) return;
    setIsSendingOtp(true);
    try {
      const result = await generateAndSendOTP({ recipient: user.email, method: 'email' });
      if (result.success) {
        setGeneratedCode(result.code);
        setShowOtpDialog(true);
        toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من بريدك الإلكتروني." });
      } else {
        toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الرمز." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = () => {
    if (otpCode === generatedCode && userRef) {
      updateDocumentNonBlocking(userRef, { emailVerified: true });
      setShowOtpDialog(false);
      toast({ title: "تم التوثيق!", description: "تم التحقق من بريدك الإلكتروني بنجاح." });
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

  const handleAddPortfolio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && firestore && user) {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        addDocumentNonBlocking(collection(firestore, "portfolio"), {
          mufhemId: user.uid,
          title: "عمل جديد",
          mediaUrl: base64,
          mediaType: type,
          status: "pending_approval",
          createdAt: new Date().toISOString()
        });
        toast({ title: "تمت إضافة العمل", description: "سيظهر العمل في ملفك الشخصي فور مراجعته." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePortfolio = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "portfolio", id));
    toast({ title: "تم الحذف" });
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
      bio: formData.bio
    });
    toast({ title: "تم التحديث", description: "تم حفظ التغييرات بنجاح." });
  };

  const handleRequestVerification = async () => {
    if (!firestore || !user || !profile) return;
    setIsVerifying(true);
    try {
      await addDoc(collection(firestore, "verificationRequests"), {
        userId: user.uid,
        userName: profile.fullName,
        userEmail: profile.email,
        profilePictureUrl: profile.profilePictureUrl,
        status: "pending",
        timestamp: new Date().toISOString()
      });
      toast({ title: "تم إرسال الطلب", description: "سيتم مراجعة بياناتك لتوثيق الحساب." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري تحميل البيانات...</div>;
  if (!profile) return <div className="p-10 text-center font-bold">يرجى تسجيل الدخول لعرض الملف الشخصي.</div>;

  const verifiedBadgeUrl = settings?.verifiedBadgeUrl || PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;
  
  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];
  const currentMainCatId = allCategories?.find(c => c.name === formData.specialization)?.id;
  const subCategories = allCategories?.filter(c => c.type === 'sub' && c.parentId === currentMainCatId) || [];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight">الملف الشخصي</h1>
          <p className="text-muted-foreground text-lg">إدارة بياناتك {profile.role === 'mufhem' ? 'ومهنيتك التعليمية' : 'الخاصة'}.</p>
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
              <Avatar className="h-44 w-44 border-8 border-white shadow-2xl transition-transform hover:scale-105">
                <AvatarImage src={formData.profilePictureUrl} />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{formData.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 rounded-2xl h-12 w-12 shadow-xl border-4 border-white bg-primary"><Upload size={20}/></Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-right">
              <h2 className="text-3xl md:text-4xl font-black flex items-center justify-center md:justify-start gap-3">
                {formData.fullName} {profile.isVerified && <img src={verifiedBadgeUrl} alt="Verified" className="h-8 w-8" data-ai-hint="verified badge" />}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className="px-4 py-1 text-md font-black">{profile.role === 'mufhem' ? 'مُفهم معتمد' : 'مُستفهم طموح'}</Badge>
                {profile.emailVerified && <Badge className="bg-green-100 text-green-600 border-none">بريد موثق</Badge>}
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
              <Input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="h-14 rounded-xl border-2 font-bold" />
            </div>
            
            {profile.role === 'mufhem' && (
              <>
                <div className="space-y-3">
                  <Label className="font-black text-lg flex items-center gap-2">القسم الرئيسي <Layers size={16} className="text-primary"/></Label>
                  <Select value={formData.specialization} onValueChange={(v) => setFormData({...formData, specialization: v, specializationSub: ""})}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-black text-lg flex items-center gap-2">التخصص الدقيق <GraduationCap size={16} className="text-accent"/></Label>
                  <Select value={formData.specializationSub} onValueChange={(v) => setFormData({...formData, specializationSub: v})}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                      <SelectValue placeholder="اختر التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label className="font-black text-lg">نبذة تعريفية للطلاب</Label>
                  <Textarea value={formData.bio} onChange={(e)=>setFormData({...formData, bio: e.target.value})} className="h-32 rounded-xl border-2 p-4 text-lg font-medium" />
                </div>
              </>
            )}
          </div>

          <div className="mt-12 flex justify-center md:justify-end">
            <Button onClick={handleSave} className="h-16 px-12 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-all"><Save className="ml-2" /> حفظ كافة التعديلات</Button>
          </div>
        </CardContent>
      </Card>

      {profile.role === 'mufhem' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-black border-r-8 border-accent pr-6">معرض أعمالك (صور وفيديو)</h3>
            <Button onClick={() => portfolioInputRef.current?.click()} className="bg-accent h-14 rounded-xl font-bold">
              <Plus className="ml-2" /> إضافة عمل جديد
            </Button>
            <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*,video/*" onChange={handleAddPortfolio} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {portfolioItems?.map(item => (
              <Card key={item.id} className="group relative aspect-square rounded-3xl overflow-hidden shadow-lg border-2 hover:border-accent transition-all bg-black">
                {item.mediaType === 'video' ? (
                  <div className="w-full h-full relative">
                    <video src={item.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle className="text-white h-8 w-8" />
                    </div>
                  </div>
                ) : (
                  <img src={item.mediaUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Work" />
                )}
                <div className="absolute top-2 right-2">
                  <Badge className={item.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'}>
                    {item.status === 'approved' ? 'منشور' : 'قيد المراجعة'}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Button variant="destructive" size="icon" onClick={() => handleDeletePortfolio(item.id)} className="h-12 w-12 rounded-xl"><Trash2 /></Button>
                </div>
              </Card>
            ))}
            {(!portfolioItems || portfolioItems.length === 0) && (
              <div className="col-span-full py-16 text-center border-4 border-dashed rounded-[2rem] text-muted-foreground font-bold">
                أضف أعمالك السابقة (صور أو فيديوهات) لزيادة ثقة الطلاب بك.
              </div>
            )}
          </div>
        </div>
      )}

      {profile.role === 'mufhem' && !profile.isVerified && (
        <Card className="rounded-[2.5rem] border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm text-blue-600"><img src={verifiedBadgeUrl} alt="Verified" className="h-10 w-10" data-ai-hint="verified badge" /></div>
            <div>
              <h4 className="text-2xl font-black text-blue-900">طلب توثيق الحساب (شارة زرقاء)</h4>
              <p className="text-blue-700 font-bold">احصل على ثقة الطالب المباشرة وزيادة في قبول استفهاماتك.</p>
            </div>
          </div>
          <Button onClick={handleRequestVerification} disabled={isVerifying} className="bg-blue-600 h-16 px-10 rounded-2xl font-black text-lg shadow-lg">
            {isVerifying ? "جاري الإرسال..." : "اطلب توثيق الآن"}
          </Button>
        </Card>
      )}

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="rounded-[2rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-black">تحقق من بريدك</DialogTitle>
            <DialogDescription className="text-right">أدخل الرمز المكون من 6 أرقام الذي أرسلناه لبريدك الإلكتروني.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Label className="font-bold">رمز التحقق</Label>
            <Input maxLength={6} className="h-16 text-3xl font-black tracking-[1em] text-center rounded-2xl" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleVerifyOTP} className="w-full h-14 text-xl font-bold rounded-xl">تحقق الآن</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
