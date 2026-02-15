"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, UserCircle, Mail, ShieldCheck, CheckCircle2, Loader2, KeyRound, UserPlus, LogIn, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // حالات التحقق من البريد (OTP)
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [serverOtpCode, setServerOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }
    setIsSendingOtp(true);
    try {
      const result = await generateAndSendOTP({ recipient: email, method: 'email' });
      if (result.success) {
        setServerOtpCode(result.code);
        setOtpSent(true);
        toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من بريدك الإلكتروني للحصول على رمز التفعيل." });
      } else {
        toast({ variant: "destructive", title: "خطأ", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في النظام", description: "تعذر الاتصال بخادم الرسائل، يرجى المحاولة لاحقاً." });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = () => {
    if (otpCodeInput === serverOtpCode && serverOtpCode !== "") {
      setIsEmailVerified(true);
      toast({ title: "تم التحقق بنجاح!", description: "شكراً لك، يمكنك الآن إكمال بيانات ملفك الشخصي." });
    } else {
      toast({ variant: "destructive", title: "رمز خاطئ", description: "الرمز الذي أدخلته غير مطابق للرمز المرسل." });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (isLogin) {
      initiateEmailSignIn(auth, email, password).catch((err: any) => {
        toast({ variant: "destructive", title: "خطأ في الدخول", description: "البريد أو كلمة المرور غير صحيحة." });
        setIsProcessing(false);
      });
    } else {
      if (!isEmailVerified) {
        toast({ variant: "destructive", title: "تحقق مطلوب", description: "يرجى التحقق من بريدك الإلكتروني أولاً." });
        setIsProcessing(false);
        return;
      }
      if (!fullName || !phoneNumber || !birthDate || !profilePictureUrl) {
        toast({ 
          variant: "destructive", 
          title: "بيانات ناقصة", 
          description: "يرجى تعبئة كافة الحقول بما فيها الصورة الشخصية لإتمام التسجيل." 
        });
        setIsProcessing(false);
        return;
      }

      initiateEmailSignUp(auth, email, password).catch((err: any) => {
        console.error(err);
        toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء الحساب، ربما البريد مستخدم مسبقاً." });
        setIsProcessing(false);
      });
    }
  };

  useEffect(() => {
    if (user && firestore && !isLogin && isEmailVerified) {
      const userRef = doc(firestore, "users", user.uid);
      getDoc(userRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(userRef, {
            id: user.uid,
            fullName,
            email: user.email,
            phoneNumber,
            role,
            gender,
            isProfileApproved: false,
            birthDate: new Date(birthDate).toISOString(),
            profilePictureUrl,
            status: "active",
            emailVerified: true,
            createdAt: new Date().toISOString()
          }).then(() => {
            router.push("/");
          });
        }
      });
    }
  }, [user, isLogin, firestore, fullName, phoneNumber, role, gender, profilePictureUrl, birthDate, router, isEmailVerified]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_30px_80px_rgba(0,0,0,0.12)] border-none rounded-[3.5rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center pt-14 pb-6 space-y-8">
          <div className="mx-auto mb-2 group transition-transform hover:scale-105 duration-500">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-36 md:h-48 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-28 h-28 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black mx-auto shadow-2xl shadow-primary/30">ف</div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black text-zinc-900 flex items-center justify-center gap-3">
              {isLogin ? <LogIn className="text-primary h-9 w-9" /> : <UserPlus className="text-accent h-9 w-9" />}
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
            </CardTitle>
            <CardDescription className="text-xl font-bold text-muted-foreground px-10">
              {isLogin ? "أهلاً بك في عالم الفهم والتميز" : "ابدأ رحلتك التعليمية معنا الآن"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-12 pb-12">
          <form onSubmit={handleAuth} className="space-y-8">
            
            {!isLogin && (
              <div className="space-y-8">
                {!isEmailVerified && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="space-y-4">
                      <Label className="font-black text-lg mr-2 flex items-center gap-2 text-zinc-700">
                        <Mail size={20} className="text-primary" /> البريد الإلكتروني
                      </Label>
                      <div className="flex gap-3">
                        <Input 
                          type="email" 
                          placeholder="name@example.com" 
                          value={email} 
                          onChange={(e)=>setEmail(e.target.value)} 
                          disabled={otpSent}
                          className="h-16 rounded-2xl border-2 font-black text-xl bg-zinc-50/50 focus:bg-white transition-all shadow-inner focus:ring-4 focus:ring-primary/10" 
                        />
                        {!otpSent && (
                          <Button 
                            type="button" 
                            onClick={handleSendOTP} 
                            disabled={isSendingOtp}
                            className="h-16 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                          >
                            {isSendingOtp ? <Loader2 className="animate-spin" /> : "تحقق"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {otpSent && (
                      <div className="p-10 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-primary/20 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-3">
                          <Label className="font-black text-2xl text-primary flex items-center justify-center gap-3">
                            <KeyRound size={28} /> رمز التحقق
                          </Label>
                          <p className="text-md text-muted-foreground font-bold">أدخل الرمز المرسل لبريدك الإلكتروني</p>
                        </div>
                        <div className="flex flex-col gap-6">
                          <Input 
                            placeholder="0 0 0 0 0 0" 
                            maxLength={6}
                            value={otpCodeInput} 
                            onChange={(e)=>setOtpCodeInput(e.target.value)}
                            className="h-24 text-5xl font-black text-center tracking-[0.4em] rounded-[2rem] border-2 border-primary/30 bg-white shadow-inner" 
                          />
                          <Button type="button" onClick={handleVerifyOTP} className="h-16 w-full rounded-2xl font-black text-2xl bg-primary shadow-2xl hover:scale-[1.02] transition-transform">
                            تأكيد الرمز والبدء
                          </Button>
                          <Button variant="link" onClick={() => { setOtpSent(false); setServerOtpCode(""); }} className="text-sm text-zinc-400 font-bold hover:text-primary">تغيير البريد الإلكتروني؟</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isEmailVerified && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-green-50 p-5 rounded-3xl border-2 border-green-100 flex items-center gap-4 text-green-700 font-black shadow-sm">
                      <div className="bg-green-500 p-2 rounded-full text-white"><CheckCircle2 size={24} /></div>
                      <div className="flex flex-col">
                        <span className="text-xs opacity-70">بريد موثق بنجاح</span>
                        <span className="text-lg">{email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center py-4">
                      <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className={`h-40 w-44 border-8 transition-all duration-500 ${profilePictureUrl ? 'border-primary/20 group-hover:scale-105' : 'border-dashed border-zinc-200 bg-zinc-50'}`}>
                          <AvatarImage src={profilePictureUrl} />
                          <AvatarFallback className="bg-zinc-50 text-zinc-300"><UserCircle className="h-24 w-24" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-2 bg-primary p-4 rounded-2xl text-white shadow-2xl border-4 border-white transition-transform group-hover:rotate-12"><Upload size={24}/></div>
                      </div>
                      <Label className="mt-6 text-sm font-black text-primary uppercase tracking-[0.2em]">رفع صورتك الشخصية</Label>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="font-black text-lg mr-2 text-zinc-700">الاسم الكامل</Label>
                      <Input placeholder="أدخل اسمك كما سيظهر للآخرين" value={fullName} onChange={(e)=>setFullName(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="font-black text-lg mr-2 text-zinc-700">رقم الهاتف</Label>
                        <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
                      </div>
                      <div className="space-y-3">
                        <Label className="font-black text-lg mr-2 text-zinc-700">تاريخ الميلاد</Label>
                        <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-zinc-50 rounded-[2.5rem] space-y-4 border border-zinc-100 shadow-sm">
                        <Label className="font-black text-xs text-muted-foreground block text-center uppercase tracking-widest">نوع الحساب</Label>
                        <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex flex-col gap-4">
                          <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border hover:border-primary transition-colors cursor-pointer group">
                            <RadioGroupItem value="mustafhem" id="r1" className="h-5 w-5"/>
                            <Label htmlFor="r1" className="text-lg font-black cursor-pointer group-hover:text-primary">مُستفهم</Label>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border hover:border-primary transition-colors cursor-pointer group">
                            <RadioGroupItem value="mufhem" id="r2" className="h-5 w-5"/>
                            <Label htmlFor="r2" className="text-lg font-black cursor-pointer group-hover:text-primary">مُفهم</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-[2.5rem] space-y-4 border border-zinc-100 shadow-sm">
                        <Label className="font-black text-xs text-muted-foreground block text-center uppercase tracking-widest">الجنس</Label>
                        <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex flex-col gap-4">
                          <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border hover:border-primary transition-colors cursor-pointer group">
                            <RadioGroupItem value="male" id="g1" className="h-5 w-5"/>
                            <Label htmlFor="g1" className="text-lg font-black cursor-pointer group-hover:text-primary">ذكر</Label>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-white rounded-2xl border hover:border-primary transition-colors cursor-pointer group">
                            <RadioGroupItem value="female" id="g2" className="h-5 w-5"/>
                            <Label htmlFor="g2" className="text-lg font-black cursor-pointer group-hover:text-primary">أنثى</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="font-black text-lg mr-2 text-zinc-700 flex items-center gap-2">
                        <Lock size={20} className="text-primary" /> تعيين كلمة المرور
                      </Label>
                      <Input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
                    </div>

                    <Button type="submit" disabled={isProcessing} className="w-full h-20 text-3xl font-black rounded-3xl bg-accent hover:bg-accent/90 shadow-2xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95">
                      {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "إنشاء الحساب الآن"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {isLogin && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <Label className="font-black text-lg mr-2 text-zinc-700 flex items-center gap-3">
                    <Mail size={22} className="text-primary" /> البريد الإلكتروني
                  </Label>
                  <Input type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl bg-zinc-50/50 focus:bg-white shadow-inner" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <Label className="font-black text-lg text-zinc-700 flex items-center gap-3">
                      <KeyRound size={22} className="text-primary" /> كلمة المرور
                    </Label>
                    <Link href="/forgot-password" size="sm" className="text-sm font-black text-primary hover:underline underline-offset-8">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl bg-zinc-50/50 focus:bg-white shadow-inner" />
                </div>

                <Button type="submit" disabled={isProcessing} className="w-full h-20 text-3xl font-black rounded-[2rem] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                  {isProcessing ? <Loader2 className="animate-spin h-10 w-10" /> : "دخول المنصة"}
                </Button>
              </div>
            )}

          </form>
        </CardContent>
        
        <CardFooter className="justify-center border-t py-10 bg-zinc-50/50">
          <Button variant="link" onClick={() => { 
            setIsLogin(!isLogin); 
            setOtpSent(false); 
            setIsEmailVerified(false); 
            setServerOtpCode("");
          }} className="font-black text-primary text-xl hover:underline underline-offset-8 flex items-center gap-2">
            {isLogin ? "ليس لديك حساب؟ انضم إلينا" : "لديك حساب بالفعل؟ سجل دخولك"}
            <ChevronRight className={`h-6 w-6 ${!isLogin ? 'rotate-180' : ''}`} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
