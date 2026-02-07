
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Lock, Save, User, LogOut, Phone, Calendar as CalendarIcon, Mail, ShieldCheck, Upload, Copy, Check, Fingerprint, GraduationCap, BadgeCheck, Smartphone, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading } = useDoc(userRef);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    birthDate: "",
    profilePictureUrl: "",
    specialization: "",
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
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ غير متوقع." });
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
      toast({ variant: "destructive", title: "رمز خاطئ", description: "يرجى المحاولة مرة أخرى." });
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
      bio: formData.bio
    });
    toast({
      title: "تم تحديث البيانات",
      description: "تم حفظ تغييرات ملفك الشخصي بنجاح.",
    });
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
      toast({ title: "تم إرسال الطلب", description: "سيتم مراجعة بياناتك لتوثيق الحساب بالعلامة الزرقاء." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال طلب التوثيق." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري تحميل البيانات...</div>;
  if (!profile) return null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2 border-r-8 border-primary pr-6">
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight">إعدادات الملف الشخصي</h1>
          <p className="text-muted-foreground text-lg md:text-xl">إدارة بياناتك الشخصية وخصوصية حسابك.</p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          className="rounded-2xl px-8 py-8 font-bold text-lg shadow-xl hover:scale-105 transition-all"
        >
          <LogOut className="ml-3 h-5 w-5" /> تسجيل الخروج
        </Button>
      </div>

      <Card className="shadow-[0_40px_80px_rgba(0,0,0,0.1)] border-2 border-primary/5 overflow-hidden rounded-[3.5rem] bg-white">
        <div className="h-48 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        </div>
        
        <CardContent className="relative px-6 md:px-12 pb-16">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10 -mt-24 mb-16">
            <div className="relative group">
              <Avatar className="h-48 w-48 border-8 border-white shadow-2xl transition-transform hover:scale-[1.02]">
                <AvatarImage src={formData.profilePictureUrl} />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                  {formData.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 rounded-2xl h-14 w-14 shadow-2xl border-4 border-white hover:scale-110 transition-transform bg-primary"
              >
                <Upload className="h-7 w-7" />
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-right">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{formData.fullName}</h2>
                  {profile.isVerified && (
                    <ShieldCheck className="h-8 w-8 text-blue-500 fill-blue-500/20" />
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-primary text-white px-6 py-1.5 text-md font-black rounded-full shadow-lg flex items-center gap-2">
                    {profile.role === 'mustafhem' ? 'مُستفهم طموح' : (
                      <>
                        {profile.isVerified ? <ShieldCheck className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4 opacity-50" />}
                        {profile.isVerified ? 'مُفهم معتمد' : 'مُفهم قيد التوثيق'}
                      </>
                    )}
                  </Badge>
                  {profile.emailVerified && (
                    <Badge className="bg-green-600 text-white px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" /> بريد موثق
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <Label htmlFor="fullName" className="text-xl font-black flex items-center gap-3">
                <User className="h-5 w-5 text-primary" /> الاسم بالكامل
              </Label>
              <Input 
                id="fullName" 
                value={formData.fullName || ""} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6 bg-muted/5 shadow-inner"
              />
            </div>

            {profile.role === 'mufhem' && (
              <div className="space-y-4">
                <Label htmlFor="specialization" className="text-xl font-black flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" /> التخصص التعليمي
                </Label>
                <Input 
                  id="specialization" 
                  placeholder="مثال: رياضيات، برمجة تطبيقات، لغة إنجليزية"
                  value={formData.specialization || ""} 
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6 bg-muted/5 shadow-inner"
                />
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-xl font-black flex items-center gap-3 text-muted-foreground/60">
                <Mail className="h-5 w-5" /> البريد الإلكتروني <Lock className="h-4 w-4" />
              </Label>
              <div className="flex gap-2">
                <Input 
                  id="email" 
                  value={profile.email || ""} 
                  readOnly 
                  disabled
                  className="h-16 text-xl font-bold rounded-2xl bg-muted/40 border-none px-6 opacity-70"
                />
                {!profile.emailVerified && (
                  <Button onClick={handleSendOTP} disabled={isSendingOtp} className="h-16 rounded-2xl bg-orange-500 font-bold px-4">
                    {isSendingOtp ? "جاري الإرسال" : "توثيق البريد"}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="phone" className="text-xl font-black flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" /> رقم الهاتف (واتساب)
              </Label>
              <Input 
                id="phone" 
                value={formData.phone || ""}
                placeholder="01xxxxxxxxx"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary px-6 bg-muted/5 shadow-inner"
              />
            </div>

            {profile.role === 'mufhem' && (
              <div className="md:col-span-2 space-y-4">
                <Label htmlFor="bio" className="text-xl font-black flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" /> نبذة تعريفية (Portfolio)
                </Label>
                <Textarea 
                  id="bio"
                  placeholder="أخبر الطلاب عن خبراتك، سنوات عملك، وأسلوبك في الشرح..."
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="min-h-[150px] text-lg rounded-2xl border-2 p-6"
                />
              </div>
            )}

            {profile.role === 'mufhem' && !profile.isVerified && (
              <div className="md:col-span-2 p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <ShieldCheck className="h-10 w-10 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-blue-900">توثيق الحساب (العلامة الزرقاء)</h4>
                    <p className="text-blue-700 text-sm font-bold">احصل على ثقة الطلاب من خلال توثيق حسابك رسمياً.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleRequestVerification} 
                  disabled={isVerifying}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 font-black"
                >
                  {isVerifying ? "جاري الإرسال..." : "طلب توثيق الآن"}
                </Button>
              </div>
            )}

            <div className="md:col-span-2 pt-12 flex justify-center md:justify-end">
              <Button 
                onClick={handleSave} 
                className="bg-primary w-full md:w-auto px-16 py-10 rounded-[2rem] font-black text-2xl shadow-xl hover:scale-105 active:scale-95 group"
              >
                <Save className="ml-4 h-8 w-8 group-hover:animate-bounce" /> حفظ التعديلات الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="rounded-[2rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-black">تحقق من بريدك</DialogTitle>
            <DialogDescription className="text-right">أدخل الرمز المكون من 6 أرقام الذي أرسلناه لبريدك الإلكتروني.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Label className="font-bold">رمز التحقق</Label>
            <Input 
              maxLength={6} 
              className="h-16 text-3xl font-black tracking-[1em] text-center rounded-2xl" 
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleVerifyOTP} className="w-full h-14 text-xl font-bold rounded-xl">تحقق الآن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
