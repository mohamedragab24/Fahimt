
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
import { Upload, UserCircle, Mail, ShieldCheck, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
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
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الرمز، حاول مرة أخرى." });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = () => {
    if (otpCodeInput === serverOtpCode && serverOtpCode !== "") {
      setIsEmailVerified(true);
      toast({ title: "تم التحقق!", description: "تم تأكيد بريدك الإلكتروني، يمكنك الآن استكمال التسجيل." });
    } else {
      toast({ variant: "destructive", title: "رمز خاطئ", description: "الرمز الذي أدخلته غير صحيح." });
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f8fafc]" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl border-t-8 border-primary rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto mb-8">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-24 md:h-32 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white text-5xl font-black mx-auto shadow-xl">ف</div>
            )}
          </div>
          <CardTitle className="text-3xl font-black text-primary">{isLogin ? "مرحباً بك مجدداً" : "انضم لعائلة فهمني"}</CardTitle>
          <CardDescription className="font-bold">{isLogin ? "ادخل لمتابعة استفهاماتك" : "تحقق من بريدك وابدأ رحلة التعلم"}</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* واجهة التسجيل (SignUp) */}
            {!isLogin && (
              <div className="space-y-5">
                
                {/* الخطوة 1: البريد و OTP */}
                {!isEmailVerified && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="font-black text-xs mr-2">البريد الإلكتروني</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="email" 
                          placeholder="name@example.com" 
                          value={email} 
                          onChange={(e)=>setEmail(e.target.value)} 
                          disabled={otpSent}
                          className="h-12 rounded-xl border-2 font-bold" 
                        />
                        {!otpSent && (
                          <Button 
                            type="button" 
                            onClick={handleSendOTP} 
                            disabled={isSendingOtp}
                            className="h-12 px-6 rounded-xl font-bold"
                          >
                            {isSendingOtp ? <Loader2 className="animate-spin" /> : "إرسال الرمز"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {otpSent && (
                      <div className="space-y-3 animate-in zoom-in-95">
                        <Label className="font-black text-xs mr-2 text-primary">أدخل رمز التحقق (OTP)</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="6 أرقام" 
                            maxLength={6}
                            value={otpCodeInput} 
                            onChange={(e)=>setOtpCodeInput(e.target.value)}
                            className="h-14 text-2xl font-black text-center tracking-widest rounded-xl border-2 border-primary/30" 
                          />
                          <Button type="button" onClick={handleVerifyOTP} className="h-14 px-8 rounded-xl font-black bg-primary">
                            تحقق
                          </Button>
                        </div>
                        <Button variant="link" onClick={() => { setOtpSent(false); setServerOtpCode(""); }} className="text-xs text-muted-foreground p-0 h-auto">تغيير البريد الإلكتروني؟</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* الخطوة 2: استكمال البيانات بعد التحقق */}
                {isEmailVerified && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-200 flex items-center gap-2 text-green-700 text-xs font-bold">
                      <CheckCircle2 size={16} /> تم التحقق من البريد: {email}
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className={`h-24 w-24 border-4 ${profilePictureUrl ? 'border-primary' : 'border-dashed border-muted-foreground/30'}`}>
                          <AvatarImage src={profilePictureUrl} />
                          <AvatarFallback className="bg-muted/30"><UserCircle className="h-12 w-12 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full text-white shadow-lg"><Upload size={14}/></div>
                      </div>
                      <Label className="mt-2 text-[10px] font-black text-primary uppercase">الصورة الشخصية</Label>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-black text-xs mr-2">الاسم الكامل</Label>
                      <Input placeholder="أدخل اسمك الثلاثي" value={fullName} onChange={(e)=>setFullName(e.target.value)} required className="h-12 rounded-xl border-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black text-xs mr-2">رقم الهاتف</Label>
                        <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required className="h-12 rounded-xl border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-xs mr-2">تاريخ الميلاد</Label>
                        <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} required className="h-12 rounded-xl border-2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/20 rounded-2xl space-y-2 border">
                        <Label className="font-black text-[10px] text-muted-foreground">نوع الحساب</Label>
                        <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2"><RadioGroupItem value="mustafhem" id="r1"/><Label htmlFor="r1" className="text-xs font-bold">مُستفهم</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="mufhem" id="r2"/><Label htmlFor="r2" className="text-xs font-bold">مُفهم</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-2xl space-y-2 border">
                        <Label className="font-black text-[10px] text-muted-foreground">الجنس</Label>
                        <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2"><RadioGroupItem value="male" id="g1"/><Label htmlFor="g1" className="text-xs font-bold">ذكر</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="female" id="g2"/><Label htmlFor="g2" className="text-xs font-bold">أنثى</Label></div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-xs mr-2">تعيين كلمة المرور</Label>
                      <Input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-12 rounded-xl border-2" />
                    </div>

                    <Button type="submit" disabled={isProcessing} className="w-full h-14 text-xl font-black rounded-2xl shadow-xl">
                      {isProcessing ? "جاري إنشاء الحساب..." : "إكمال التسجيل"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* واجهة الدخول (Login) */}
            {isLogin && (
              <div className="space-y-5 animate-in fade-in">
                <div className="space-y-2">
                  <Label className="font-black text-xs mr-2">البريد الإلكتروني</Label>
                  <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-12 rounded-xl border-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2 mb-1">
                    <Link href="/forgot-password" size="sm" className="text-[10px] font-black text-primary hover:underline">
                      نسيت كلمة المرور؟
                    </Link>
                    <Label className="font-black text-xs">كلمة المرور</Label>
                  </div>
                  <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-12 rounded-xl border-2" />
                </div>

                <Button type="submit" disabled={isProcessing} className="w-full h-14 text-xl font-black rounded-2xl shadow-xl">
                  {isProcessing ? <Loader2 className="animate-spin" /> : "دخول"}
                </Button>
              </div>
            )}

          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-6 bg-muted/5">
          <Button variant="link" onClick={() => { 
            setIsLogin(!isLogin); 
            setOtpSent(false); 
            setIsEmailVerified(false); 
            setServerOtpCode("");
          }} className="font-bold text-primary">
            {isLogin ? "ليس لديك حساب؟ سجل كـ مُستفهم أو مُفهم" : "لديك حساب بالفعل؟ ادخل"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
