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
import { Upload, UserCircle, Mail, ShieldCheck, CheckCircle2, Loader2, KeyRound, UserPlus, LogIn } from "lucide-react";
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
            password, 
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
  }, [user, isLogin, firestore, fullName, phoneNumber, role, gender, profilePictureUrl, birthDate, router, password, isEmailVerified]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-none rounded-[3rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center pt-12 pb-6 space-y-6">
          <div className="mx-auto mb-4 scale-110">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-32 md:h-40 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white text-5xl font-black mx-auto shadow-xl">ف</div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black text-zinc-900 flex items-center justify-center gap-3">
              {isLogin ? <><LogIn className="text-primary h-8 w-8" /> مرحباً بك مجدداً</> : <><UserPlus className="text-accent h-8 w-8" /> انضم لأسرة فهمني</>}
            </CardTitle>
            <CardDescription className="text-lg font-bold text-muted-foreground">
              {isLogin ? "ادخل لمتابعة استفهاماتك اليومية" : "خطوات بسيطة وتبدأ رحلة الفهم الحقيقية"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleAuth} className="space-y-6">
            
            {!isLogin && (
              <div className="space-y-6">
                {!isEmailVerified && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-3">
                      <Label className="font-black text-sm mr-2 flex items-center gap-2">
                        <Mail size={16} className="text-primary" /> البريد الإلكتروني
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          type="email" 
                          placeholder="name@example.com" 
                          value={email} 
                          onChange={(e)=>setEmail(e.target.value)} 
                          disabled={otpSent}
                          className="h-16 rounded-2xl border-2 font-bold text-lg bg-zinc-50/50 focus:bg-white transition-colors" 
                        />
                        {!otpSent && (
                          <Button 
                            type="button" 
                            onClick={handleSendOTP} 
                            disabled={isSendingOtp}
                            className="h-16 px-8 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                          >
                            {isSendingOtp ? <Loader2 className="animate-spin" /> : "إرسال"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {otpSent && (
                      <div className="p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                          <Label className="font-black text-xl text-primary flex items-center justify-center gap-2">
                            <KeyRound size={24} /> رمز التحقق (OTP)
                          </Label>
                          <p className="text-sm text-muted-foreground font-bold">أدخل الرمز المكون من 6 أرقام المرسل لبريدك</p>
                        </div>
                        <div className="flex flex-col gap-4">
                          <Input 
                            placeholder="0 0 0 0 0 0" 
                            maxLength={6}
                            value={otpCodeInput} 
                            onChange={(e)=>setOtpCodeInput(e.target.value)}
                            className="h-20 text-4xl font-black text-center tracking-[0.5em] rounded-3xl border-2 border-primary/30 bg-white shadow-inner focus:ring-4 focus:ring-primary/10" 
                          />
                          <Button type="button" onClick={handleVerifyOTP} className="h-16 w-full rounded-2xl font-black text-xl bg-primary shadow-xl">
                            تأكيد الرمز والبدء
                          </Button>
                          <Button variant="link" onClick={() => { setOtpSent(false); setServerOtpCode(""); }} className="text-xs text-zinc-400 font-bold hover:text-primary">تغيير البريد الإلكتروني؟</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isEmailVerified && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-200 flex items-center gap-3 text-green-700 font-black shadow-sm">
                      <CheckCircle2 size={24} /> تم التحقق من: {email}
                    </div>

                    <div className="flex flex-col items-center py-4">
                      <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className={`h-32 w-32 border-8 transition-all ${profilePictureUrl ? 'border-primary/20 group-hover:scale-105' : 'border-dashed border-zinc-200 bg-zinc-50'}`}>
                          <AvatarImage src={profilePictureUrl} />
                          <AvatarFallback className="bg-zinc-50 text-zinc-300"><UserCircle className="h-16 w-16" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-primary p-3 rounded-2xl text-white shadow-xl border-4 border-white"><Upload size={18}/></div>
                      </div>
                      <Label className="mt-4 text-xs font-black text-primary uppercase tracking-widest">رفع صورتك الشخصية</Label>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-black text-sm mr-2 text-zinc-700">الاسم الكامل (كما سيظهر للعامة)</Label>
                      <Input placeholder="أدخل اسمك الثلاثي" value={fullName} onChange={(e)=>setFullName(e.target.value)} required className="h-14 rounded-2xl border-2 font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black text-sm mr-2 text-zinc-700">رقم الهاتف</Label>
                        <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required className="h-14 rounded-2xl border-2 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-sm mr-2 text-zinc-700">تاريخ الميلاد</Label>
                        <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} required className="h-14 rounded-2xl border-2 font-bold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 rounded-[2rem] space-y-3 border border-zinc-100 shadow-sm">
                        <Label className="font-black text-[10px] text-muted-foreground block text-center uppercase">نوع الحساب</Label>
                        <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border"><RadioGroupItem value="mustafhem" id="r1"/><Label htmlFor="r1" className="text-sm font-black cursor-pointer">مُستفهم</Label></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border"><RadioGroupItem value="mufhem" id="r2"/><Label htmlFor="r2" className="text-sm font-black cursor-pointer">مُفهم</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-[2rem] space-y-3 border border-zinc-100 shadow-sm">
                        <Label className="font-black text-[10px] text-muted-foreground block text-center uppercase">الجنس</Label>
                        <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border"><RadioGroupItem value="male" id="g1"/><Label htmlFor="g1" className="text-sm font-black cursor-pointer">ذكر</Label></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border"><RadioGroupItem value="female" id="g2"/><Label htmlFor="g2" className="text-sm font-black cursor-pointer">أنثى</Label></div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-sm mr-2 text-zinc-700">تعيين كلمة المرور</Label>
                      <Input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-14 rounded-2xl border-2 font-bold" />
                    </div>

                    <Button type="submit" disabled={isProcessing} className="w-full h-16 text-2xl font-black rounded-3xl bg-accent hover:bg-accent/90 shadow-2xl shadow-accent/20 transition-all hover:scale-105">
                      {isProcessing ? "جاري تجهيز حسابك..." : "إنشاء الحساب الآن"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {isLogin && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <Label className="font-black text-sm mr-2 text-zinc-700 flex items-center gap-2">
                    <Mail size={16} className="text-primary" /> البريد الإلكتروني
                  </Label>
                  <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-bold text-lg bg-zinc-50/50" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <Label className="font-black text-sm text-zinc-700 flex items-center gap-2">
                      <KeyRound size={16} className="text-primary" /> كلمة المرور
                    </Label>
                    <Link href="/forgot-password" size="sm" className="text-xs font-black text-primary hover:underline underline-offset-4">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-16 rounded-2xl border-2 font-bold text-lg bg-zinc-50/50" />
                </div>

                <Button type="submit" disabled={isProcessing} className="w-full h-16 text-2xl font-black rounded-3xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-105">
                  {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "دخول المنصة"}
                </Button>
              </div>
            )}

          </form>
        </CardContent>
        
        <CardFooter className="justify-center border-t py-8 bg-zinc-50/50">
          <Button variant="link" onClick={() => { 
            setIsLogin(!isLogin); 
            setOtpSent(false); 
            setIsEmailVerified(false); 
            setServerOtpCode("");
          }} className="font-black text-primary text-lg hover:underline underline-offset-8">
            {isLogin ? "ليس لديك حساب؟ سجل كـ مُستفهم أو مُفهم" : "لديك حساب بالفعل؟ ادخل للمنصة"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
