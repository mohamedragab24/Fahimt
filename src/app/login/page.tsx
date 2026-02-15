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
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  UserCircle, 
  Mail, 
  ShieldCheck, 
  Loader2, 
  KeyRound, 
  LogIn, 
  ChevronRight, 
  Calendar,
  Smartphone,
  MessageSquare,
  User,
} from "lucide-react";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRIES = [
  { code: "+20", name: "مصر", flag: "🇪🇬" },
  { code: "+966", name: "السعودية", flag: "🇸🇦" },
  { code: "+971", name: "الإمارات", flag: "🇦🇪" },
  { code: "+965", name: "الكويت", flag: "🇰🇼" },
  { code: "+974", name: "قطر", flag: "🇶🇦" },
  { code: "+962", name: "الأردن", flag: "🇯🇴" },
  { code: "+968", name: "عمان", flag: "🇴🇲" },
  { code: "+973", name: "البحرين", flag: "🇧🇭" },
  { code: "+212", name: "المغرب", flag: "🇲🇦" },
  { code: "+213", name: "الجزائر", flag: "🇩🇿" },
  { code: "+216", name: "تونس", flag: "🇹🇳" },
  { code: "+218", name: "ليبيا", flag: "🇱🇾" },
];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'info' | 'verify'>('info');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [birthDate, setBirthDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [otpMethod, setOtpMethod] = useState<'email' | 'whatsapp'>('whatsapp');
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (user && !isUserLoading && isLogin) {
      router.push("/");
    }
  }, [user, isUserLoading, router, isLogin]);

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

  const handleStartSignUp = async () => {
    if (!fullName || !phoneNumber || !birthDate || !profilePictureUrl || !email || !password) {
      toast({ 
        variant: "destructive", 
        title: "بيانات ناقصة", 
        description: "يرجى تعبئة كافة الحقول ورفع الصورة الشخصية." 
      });
      return;
    }
    setIsProcessing(true);
    try {
      // بناء الرقم الدولي الكامل: كود الدولة + الرقم بدون الصفر الأول إذا وجد
      const cleanPhone = phoneNumber.startsWith("0") ? phoneNumber.substring(1) : phoneNumber;
      const fullPhone = `${countryCode}${cleanPhone}`;
      const recipient = otpMethod === 'whatsapp' ? fullPhone : email;
      
      console.log(`[CLIENT] Sending OTP via ${otpMethod} to: ${recipient}`);

      const result = await generateAndSendOTP({ recipient, method: otpMethod });
      if (result.success) {
        setGeneratedCode(result.code);
        setStep('verify');
        toast({ 
          title: "تم إرسال الرمز", 
          description: `تحقق من حسابك في ${otpMethod === 'whatsapp' ? 'الواتساب' : 'البريد الإلكتروني'}.` 
        });
      } else {
        toast({ variant: "destructive", title: "فشل الإرسال", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ تقني", description: "تعذر الاتصال بخدمة التحقق." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode !== generatedCode) {
      toast({ variant: "destructive", title: "رمز خاطئ", description: "الرمز الذي أدخلته غير صحيح." });
      return;
    }
    setIsProcessing(true);
    try {
      const cred = await initiateEmailSignUp(auth, email, password);
      if (cred.user) {
        const cleanPhone = phoneNumber.startsWith("0") ? phoneNumber.substring(1) : phoneNumber;
        const fullPhone = `${countryCode}${cleanPhone}`;
        const userRef = doc(firestore!, "users", cred.user.uid);
        await setDoc(userRef, {
          id: cred.user.uid,
          fullName,
          email,
          phoneNumber: fullPhone,
          role,
          gender,
          isProfileApproved: false,
          birthDate: new Date(birthDate).toISOString(),
          profilePictureUrl,
          status: "active",
          emailVerified: true,
          createdAt: new Date().toISOString()
        });
        toast({ title: "تم إنشاء الحساب!", description: "أهلاً بك في منصة فهمني." });
        router.push("/");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: "البريد الإلكتروني مستخدم بالفعل أو كلمة المرور ضعيفة." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    initiateEmailSignIn(auth, email, password).catch((err: any) => {
      toast({ variant: "destructive", title: "خطأ في الدخول", description: "البريد أو كلمة المرور غير صحيحة." });
      setIsProcessing(false);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F8FAFC]" dir="rtl">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10"></div>
      
      <Card className="w-full max-w-xl shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-4 border-white rounded-[4rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="text-center pt-12 pb-6 space-y-8">
          <div className="mx-auto w-fit group">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-32 md:h-40 mx-auto object-contain transition-transform duration-500 group-hover:scale-110" alt="Logo" />
            ) : (
              <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mx-auto shadow-2xl">ف</div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black text-zinc-900 tracking-tight flex items-center justify-center gap-3">
              {isLogin ? "دخول المنصة" : "انضم لعائلة فهمني"}
            </CardTitle>
            <CardDescription className="text-lg font-bold text-zinc-500">
              {isLogin ? "يسعدنا رؤيتك مجدداً في فهمني" : "سجل الآن وابدأ رحلتك التعليمية الفريدة"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 md:px-12 pb-10">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-md mr-2 flex items-center gap-2">البريد الإلكتروني <Mail size={18} className="text-primary" /></Label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg focus:border-primary shadow-sm" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <Label className="font-black text-md flex items-center gap-2">كلمة المرور <KeyRound size={18} className="text-primary" /></Label>
                  <Link href="/forgot-password" size="sm" className="text-sm font-black text-primary hover:underline">نسيت كلمة المرور؟</Link>
                </div>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg focus:border-primary shadow-sm" />
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl shadow-xl bg-primary hover:scale-[1.02] transition-transform">
                {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تسجيل الدخول"}
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              {step === 'info' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className={`h-40 w-44 border-[6px] transition-all group-hover:scale-105 ${profilePictureUrl ? 'border-primary/20 shadow-2xl' : 'border-dashed border-zinc-200 bg-zinc-50'}`}>
                        <AvatarImage src={profilePictureUrl} />
                        <AvatarFallback className="bg-transparent"><UserCircle className="h-24 w-24 text-zinc-300" /></AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-primary p-4 rounded-2xl text-white shadow-xl border-4 border-white"><Upload size={24}/></div>
                    </div>
                    <Label className="font-black text-zinc-500 text-sm">ارفع صورتك الشخصية</Label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">الاسم الكامل <User size={18} className="text-primary"/></Label>
                      <Input placeholder="أدخل اسمك الثلاثي" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl shadow-sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">رقم الهاتف <Smartphone size={18} className="text-primary"/></Label>
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[100px] h-16 rounded-2xl border-2 font-black">
                              <SelectValue placeholder="الرمز" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c.code} value={c.code} className="font-bold">
                                  <span className="ml-2">{c.flag}</span> {c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="h-16 flex-1 rounded-2xl border-2 font-black text-xl shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">تاريخ الميلاد <Calendar size={18} className="text-primary"/></Label>
                        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg shadow-sm" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">البريد الإلكتروني <Mail size={18} className="text-primary"/></Label>
                      <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl shadow-sm" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">كلمة المرور <KeyRound size={18} className="text-primary"/></Label>
                      <Input type="password" placeholder="أدخل كلمة مرور قوية" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl shadow-sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-4">
                        <Label className="text-sm font-black text-muted-foreground block mb-2">نوع الحساب</Label>
                        <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex gap-4">
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm"><RadioGroupItem value="mustafhem" id="r1" /><Label htmlFor="r1" className="text-xs font-black cursor-pointer">مُستفهم</Label></div>
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm"><RadioGroupItem value="mufhem" id="r2" /><Label htmlFor="r2" className="text-xs font-black cursor-pointer">مُفهم</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-4">
                        <Label className="text-sm font-black text-muted-foreground block mb-2">الجنس</Label>
                        <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex gap-4">
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm"><RadioGroupItem value="male" id="g1" /><Label htmlFor="g1" className="text-xs font-black cursor-pointer">ذكر</Label></div>
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm"><RadioGroupItem value="female" id="g2" /><Label htmlFor="g2" className="text-xs font-black cursor-pointer">أنثى</Label></div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 space-y-6">
                    <div className="flex items-center justify-center gap-2 text-primary font-black">
                      <ShieldCheck /> <span>اختر وسيلة تأكيد الحساب</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        type="button"
                        onClick={() => setOtpMethod('whatsapp')} 
                        variant={otpMethod === 'whatsapp' ? 'default' : 'outline'} 
                        className={`h-16 rounded-2xl font-black text-lg transition-all ${otpMethod === 'whatsapp' ? 'bg-primary shadow-lg scale-105' : 'bg-white'}`}
                      >
                        <MessageSquare size={20} className="ml-2"/> واتساب
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => setOtpMethod('email')} 
                        variant={otpMethod === 'email' ? 'default' : 'outline'} 
                        className={`h-16 rounded-2xl font-black text-lg transition-all ${otpMethod === 'email' ? 'bg-primary shadow-lg scale-105' : 'bg-white'}`}
                      >
                        <Mail size={20} className="ml-2"/> بريد
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleStartSignUp} disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-accent hover:scale-[1.02] shadow-2xl transition-all">
                    {isProcessing ? <><Loader2 className="animate-spin ml-3 h-8 w-8" /> جاري الإرسال...</> : "إرسال رمز التحقق الآن"}
                  </Button>
                </div>
              )}

              {step === 'verify' && (
                <div className="space-y-10 animate-in slide-in-from-left duration-500">
                  <div className="text-center space-y-4">
                    <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-accent shadow-inner animate-pulse">
                      <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-zinc-900">تحقق من {otpMethod === 'whatsapp' ? 'الواتساب' : 'البريد'}</h3>
                      <p className="text-lg font-bold text-zinc-500 px-10">أرسلنا الرمز المكون من 6 أرقام إلى هاتفك.</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Input 
                      maxLength={6} 
                      placeholder="0 0 0 0 0 0"
                      className="h-24 text-5xl font-black text-center tracking-[0.4em] rounded-[2rem] border-4 border-accent/20 focus:border-accent shadow-inner bg-zinc-50"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <Button onClick={handleVerifyAndRegister} disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-accent shadow-2xl hover:scale-[1.02] transition-transform">
                      {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تأكيد وتفعيل الحساب"}
                    </Button>
                    <div className="text-center space-y-2">
                      <Button variant="ghost" onClick={() => setStep('info')} className="w-full font-black text-zinc-400 text-lg hover:text-zinc-600">
                        تعديل بيانات التسجيل
                      </Button>
                      <p className="text-xs text-muted-foreground font-bold italic">* تأكد من تفعيل Sandbox في Infobip إذا كنت تستخدم حساباً تجريبياً.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t py-10 bg-zinc-50/50">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="font-black text-primary text-xl flex items-center gap-3 hover:scale-105 transition-transform">
            {isLogin ? "مستخدم جديد؟ سجل الآن" : "لديك حساب؟ سجل دخولك"}
            <ChevronRight className={`h-6 w-6 transition-transform ${!isLogin ? 'rotate-180' : ''}`} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
