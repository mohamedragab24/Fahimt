"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
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
  Info,
  FileText,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const COUNTRIES = [
  { code: "20", name: "مصر", flag: "🇪🇬" },
  { code: "966", name: "السعودية", flag: "🇸🇦" },
  { code: "971", name: "الإمارات", flag: "🇦🇪" },
  { code: "965", name: "الكويت", flag: "🇰🇼" },
  { code: "974", name: "قطر", flag: "🇶🇦" },
  { code: "962", name: "الأردن", flag: "🇯🇴" },
  { code: "968", name: "عمان", flag: "🇴🇲" },
  { code: "973", name: "البحرين", flag: "🇧🇭" },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get('mode') === 'signup' ? false : true;
  const returnTo = searchParams?.get('returnTo');

  const [isLogin, setIsLogin] = useState(initialMode);
  const [step, setStep] = useState<'info' | 'verify'>('info');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("20");
  const [birthDate, setBirthDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [otpMethod, setOtpMethod] = useState<'email' | 'whatsapp'>('whatsapp');
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (returnTo === 'create-request') {
      setRole("mustafhem");
    }
  }, [returnTo]);

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
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول ورفع الصورة الشخصية." });
      return;
    }

    if (!agreedToTerms) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة." });
      return;
    }

    setIsProcessing(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '').startsWith('0') ? phoneNumber.replace(/\D/g, '').substring(1) : phoneNumber.replace(/\D/g, '');
      const fullPhone = `${countryCode}${cleanPhone}`;
      const recipient = otpMethod === 'whatsapp' ? fullPhone : email;
      
      const result = await generateAndSendOTP({ recipient, method: otpMethod });
      if (result.success) {
        setGeneratedCode(result.code);
        setStep('verify');
        toast({ title: "تم إرسال الرمز", description: `تحقق من ${otpMethod === 'whatsapp' ? 'الواتساب' : 'البريد'}.` });
      } else {
        toast({ variant: "destructive", title: "فشل الإرسال", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "تعذر الاتصال بخدمة التحقق." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode !== generatedCode) {
      toast({ variant: "destructive", title: "رمز خاطئ" });
      return;
    }
    setIsProcessing(true);
    try {
      const cred = await initiateEmailSignUp(auth, email, password);
      if (cred.user) {
        const cleanPhone = phoneNumber.replace(/\D/g, '').startsWith('0') ? phoneNumber.replace(/\D/g, '').substring(1) : phoneNumber.replace(/\D/g, '');
        const fullPhone = `${countryCode}${cleanPhone}`;
        
        await setDoc(doc(firestore!, "users", cred.user.uid), {
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
          createdAt: new Date().toISOString()
        });

        const pendingIstifham = localStorage.getItem('pending_istifham');
        if (pendingIstifham) {
          const data = JSON.parse(pendingIstifham);
          await addDoc(collection(firestore!, "istifhams"), {
            ...data,
            amount: Number(data.amount),
            status: "pending_approval",
            mustafhemId: cred.user.uid,
            mustafhemName: fullName,
            createdAt: new Date().toISOString()
          });
          localStorage.removeItem('pending_istifham');
          toast({ title: "تم التسجيل وإرسال استفهامك!", description: "طلبك قيد المراجعة الآن." });
        } else {
          toast({ title: "تم إنشاء الحساب!" });
        }
        
        router.push("/");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: "البريد مستخدم بالفعل أو خطأ تقني." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    initiateEmailSignIn(auth, email, password).then(() => {
      const pendingIstifham = localStorage.getItem('pending_istifham');
      if (pendingIstifham && auth.currentUser) {
        const data = JSON.parse(pendingIstifham);
        addDoc(collection(firestore!, "istifhams"), {
          ...data,
          amount: Number(data.amount),
          status: "pending_approval",
          mustafhemId: auth.currentUser.uid,
          mustafhemName: auth.currentUser.displayName || "مستخدم",
          createdAt: new Date().toISOString()
        }).then(() => {
          localStorage.removeItem('pending_istifham');
          toast({ title: "تم تسجيل دخولك وإرسال استفهامك المعلق!" });
        });
      }
    }).catch(() => {
      toast({ variant: "destructive", title: "خطأ", description: "البيانات غير صحيحة." });
      setIsProcessing(false);
    });
  };

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F8FAFC]" dir="rtl">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10"></div>
      
      <Card className="w-full max-w-xl shadow-2xl border-4 border-white rounded-[4rem] bg-white overflow-hidden animate-in fade-in duration-700">
        <CardHeader className="text-center pt-12 pb-6 space-y-8">
          <div className="mx-auto w-fit group">
            {settings?.logoUrl ? (
              <div className="h-32 md:h-44 flex items-center justify-center">
                <img src={settings.logoUrl} className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110" alt="Logo" />
              </div>
            ) : (
              <div className="w-24 h-24 flex items-center justify-center text-primary text-5xl font-black mx-auto">ف</div>
            )}
          </div>
          <CardTitle className="text-4xl font-black text-zinc-900 tracking-tight">
            {isLogin ? "دخول المنصة" : "انضم لـ " + (settings?.siteTitle || "فهمني")}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-8 md:px-12 pb-10">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black flex items-center gap-2">البريد الإلكتروني <Mail size={18} className="text-primary" /></Label>
                <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <Label className="font-black flex items-center gap-2">كلمة المرور <KeyRound size={18} className="text-primary" /></Label>
                  <Link href="/forgot-password" size="sm" className="text-sm font-black text-primary">نسيت كلمة المرور؟</Link>
                </div>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                    required 
                    className="h-16 rounded-2xl border-2 font-black text-lg pl-12" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-primary shadow-xl">
                {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تسجيل الدخول"}
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              {step === 'info' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className={`h-40 w-44 border-[6px] transition-all group-hover:scale-105 ${profilePictureUrl ? 'border-primary/20 shadow-xl' : 'border-dashed border-zinc-200'}`}>
                        <AvatarImage src={profilePictureUrl} />
                        <AvatarFallback className="bg-transparent"><UserCircle className="h-24 w-24 text-zinc-200" /></AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-primary p-4 rounded-2xl text-white border-4 border-white shadow-lg"><Upload size={24}/></div>
                    </div>
                    <Label className="font-black text-zinc-400 text-sm">ارفع صورتك الشخصية</Label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-black flex items-center gap-2">الاسم الكامل <User size={18} className="text-primary"/></Label>
                      <Input placeholder="أدخل اسمك الثلاثي" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-black flex items-center gap-2">رقم الهاتف <Smartphone size={18} className="text-primary"/></Label>
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[100px] h-16 rounded-2xl border-2 font-black">
                              <SelectValue placeholder="الرمز" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c.code} value={c.code} className="font-bold">
                                  <span className="ml-2">{c.flag}</span> +{c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="h-16 flex-1 rounded-2xl border-2 font-black text-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black flex items-center gap-2">تاريخ الميلاد <Calendar size={18} className="text-primary"/></Label>
                        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black flex items-center gap-2">البريد الإلكتروني <Mail size={18} className="text-primary"/></Label>
                      <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black flex items-center gap-2">كلمة المرور <KeyRound size={18} className="text-primary"/></Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={(e)=>setPassword(e.target.value)} 
                          required 
                          className="h-16 rounded-2xl border-2 font-black text-xl pl-12" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-4">
                        <Label className="text-sm font-black text-muted-foreground block">نوع الحساب</Label>
                        <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex gap-4">
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm"><RadioGroupItem value="mustafhem" id="r1" /><Label htmlFor="r1" className="text-xs font-black cursor-pointer">مُستفهم</Label></div>
                          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm"><RadioGroupItem value="mufhem" id="r2" /><Label htmlFor="r2" className="text-xs font-black cursor-pointer">مُفهم</Label></div>
                        </RadioGroup>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed space-y-4">
                        <Label className="text-sm font-black text-muted-foreground block">الجنس</Label>
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
                      <Button onClick={() => setOtpMethod('whatsapp')} variant={otpMethod === 'whatsapp' ? 'default' : 'outline'} className={`h-16 rounded-2xl font-black text-lg transition-all ${otpMethod === 'whatsapp' ? 'bg-primary shadow-lg scale-105' : 'bg-white'}`}>
                        <MessageSquare size={20} className="ml-2"/> واتساب
                      </Button>
                      <Button onClick={() => setOtpMethod('email')} variant={otpMethod === 'email' ? 'default' : 'outline'} className={`h-16 rounded-2xl font-black text-lg transition-all ${otpMethod === 'email' ? 'bg-primary shadow-lg scale-105' : 'bg-white'}`}>
                        <Mail size={20} className="ml-2"/> بريد
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-muted/20 rounded-[2rem] border-2 border-dashed border-primary/10 animate-in fade-in slide-in-from-top-2 duration-700">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms} 
                      onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                      className="mt-1 h-6 w-6 rounded-md border-2 border-primary shadow-sm data-[state=checked]:bg-primary data-[state=checked]:text-white"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="terms" className="text-sm md:text-md font-bold leading-relaxed cursor-pointer select-none text-right">
                        أوافق على <Link href="/terms" target="_blank" className="text-primary hover:underline font-black decoration-dotted">شروط الاستخدام</Link> و <Link href="/privacy" target="_blank" className="text-primary hover:underline font-black decoration-dotted">سياسة الخصوصية</Link> الخاصة بمنصة فهمني.
                      </Label>
                      <p className="text-[10px] text-muted-foreground font-medium">يجب الموافقة للمتابعة.</p>
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
                    <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-accent animate-pulse">
                      <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-zinc-900">تحقق من {otpMethod === 'whatsapp' ? 'الواتساب' : 'البريد'}</h3>
                      <p className="text-lg font-bold text-zinc-500 px-10">أدخل الرمز المكون من 6 أرقام للمتابعة.</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Input 
                      maxLength={6} 
                      placeholder="0 0 0 0 0 0"
                      className="h-24 text-5xl font-black text-center tracking-[0.4em] rounded-[2rem] border-4 border-accent/20 bg-zinc-50"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <Button onClick={handleVerifyAndRegister} disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-accent shadow-2xl">
                      {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تأكيد وتفعيل الحساب"}
                    </Button>
                    <div className="p-4 bg-blue-50 rounded-2xl text-xs font-bold text-blue-700 flex items-start gap-3">
                      <div className="shrink-0 mt-0.5"><Info size={16} /></div>
                      <p>إذا لم يصلك الرمز عبر الواتساب، تأكد من إرسال كلمة <b>START</b> للرقم <b>447860099299</b> إذا كان حسابك تجريبياً.</p>
                    </div>
                    <Button variant="ghost" onClick={() => setStep('info')} className="w-full font-black text-zinc-400 text-lg">تعديل البيانات</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t py-10 bg-zinc-50/50">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="font-black text-primary text-xl flex items-center gap-3">
            {isLogin ? "مستخدم جديد؟ سجل الآن" : "لديك حساب؟ سجل دخولك"}
            <ChevronRight className={`h-6 w-6 transition-transform ${!isLogin ? 'rotate-180' : ''}`} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse">جاري تحميل صفحة الدخول...</div>}>
      <LoginContent />
    </Suspense>
  );
}
