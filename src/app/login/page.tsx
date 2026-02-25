
"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  ShieldCheck, 
  Loader2, 
  KeyRound, 
  ChevronRight, 
  Smartphone, 
  MessageSquare, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "20", name: "مصر", flag: "🇪🇬", length: 10 },
  { code: "966", name: "السعودية", flag: "🇸🇦", length: 9 },
  { code: "971", name: "الإمارات", flag: "🇦🇪", length: 9 },
  { code: "965", name: "الكويت", flag: "🇰🇼", length: 8 },
  { code: "974", name: "قطر", flag: "🇶🇦", length: 8 },
  { code: "962", name: "الأردن", flag: "🇯🇴", length: 9 },
  { code: "968", name: "عمان", flag: "🇴🇲", length: 8 },
  { code: "973", name: "البحرين", flag: "🇧🇭", length: 8 },
  { code: "212", name: "المغرب", flag: "🇲🇦", length: 9 },
  { code: "213", name: "الجزائر", flag: "🇩🇿", length: 9 },
  { code: "216", name: "تونس", flag: "🇹🇳", length: 8 },
  { code: "218", name: "ليبيا", flag: "🇱🇾", length: 9 },
  { code: "961", name: "لبنان", flag: "🇱🇧", length: 8 },
  { code: "963", name: "سوريا", flag: "🇸🇾", length: 9 },
  { code: "964", name: "العراق", flag: "🇮🇶", length: 10 },
  { code: "970", name: "فلسطين", flag: "🇵🇸", length: 9 },
  { code: "249", name: "السودان", flag: "🇸🇩", length: 9 },
  { code: "967", name: "اليمن", flag: "🇾🇪", length: 9 },
  { code: "251", name: "إثيوبيا", flag: "🇪🇹", length: 9 },
  { code: "252", name: "الصومال", flag: "🇸🇴", length: 9 },
  { code: "253", name: "جيبوتي", flag: "🇩🇯", length: 8 },
  { code: "222", name: "موريتانيا", flag: "🇲🇷", length: 8 },
  { code: "269", name: "جزر القمر", flag: "🇰🇲", length: 7 },
  { code: "1", name: "أمريكا", flag: "🇺🇸", length: 10 },
  { code: "44", name: "بريطانيا", flag: "🇬🇧", length: 10 },
  { code: "1", name: "كندا", flag: "🇨🇦", length: 10 },
  { code: "90", name: "تركيا", flag: "🇹🇷", length: 10 },
  { code: "33", name: "فرنسا", flag: "🇫🇷", length: 9 },
  { code: "49", name: "ألمانيا", flag: "🇩🇪", length: 11 },
  { code: "39", name: "إيطاليا", flag: "🇮🇹", length: 10 },
  { code: "34", name: "إسبانيا", flag: "🇪🇸", length: 9 },
  { code: "7", name: "روسيا", flag: "🇷🇺", length: 10 },
  { code: "86", name: "الصين", flag: "🇨🇳", length: 11 },
  { code: "81", name: "اليابان", flag: "🇯🇵", length: 10 },
  { code: "82", name: "كوريا ج", flag: "🇰🇷", length: 10 },
  { code: "91", name: "الهند", flag: "🇮🇳", length: 10 },
  { code: "61", name: "أستراليا", flag: "🇦🇺", length: 9 },
  { code: "55", name: "البرازيل", flag: "🇧🇷", length: 11 },
  { code: "60", name: "ماليزيا", flag: "🇲🇾", length: 9 },
  { code: "62", name: "إندونيسيا", flag: "🇮🇩", length: 11 },
  { code: "92", name: "باكستان", flag: "🇵🇰", length: 10 },
  { code: "234", name: "نيجيريا", flag: "🇳🇬", length: 10 },
  { code: "27", name: "جنوب أفريقيا", flag: "🇿🇦", length: 9 },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get('mode') === 'signup' ? false : true;
  const returnTo = searchParams?.get('returnTo');

  const [isLogin, setIsLogin] = useState(initialMode);
  const [step, setStep] = useState<'info' | 'verify'>('info');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("20");
  const [birthDate, setBirthDate] = useState("");
  const [otpMethod, setOtpMethod] = useState<'email' | 'whatsapp'>('whatsapp');
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading && isLogin) {
      router.push("/");
    }
  }, [user, isUserLoading, router, isLogin]);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length > 6) strength += 33;
    if (/[0-9]/.test(pass)) strength += 33;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength += 34;
    return strength;
  };

  const handleStartSignUp = async () => {
    if (!firstName || !lastName || !phoneNumber || !birthDate || !email || !password || !confirmPassword) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "كلمات المرور غير متطابقة" });
      return;
    }

    if (!agreedToTerms) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب الموافقة على الشروط للمتابعة." });
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
        toast({ title: "تم إرسال الرمز" });
      } else {
        toast({ variant: "destructive", title: "فشل الإرسال", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الاتصال" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode !== generatedCode) {
      toast({ variant: "destructive", title: "رمز التحقق خاطئ" });
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
          fullName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email,
          phoneNumber: fullPhone,
          role,
          gender,
          isProfileApproved: false,
          birthDate: new Date(birthDate).toISOString(),
          status: "active",
          createdAt: new Date().toISOString(),
          needsProfileCompletion: true
        });

        toast({ title: "تم إنشاء الحساب بنجاح!" });
        router.push("/profile");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    initiateEmailSignIn(auth, email, password).then(() => {
      router.push("/");
    }).catch(() => {
      toast({ variant: "destructive", title: "البيانات غير صحيحة" });
      setIsProcessing(false);
    });
  };

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F8FAFC]" dir="rtl">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10"></div>
      
      <Card className="w-full max-w-xl shadow-2xl border-4 border-white rounded-[4rem] bg-white overflow-hidden animate-in fade-in duration-700">
        <CardHeader className="text-center pt-12 pb-6 space-y-8">
          <div className="mx-auto w-fit group">
            {settings?.logoUrl ? (
              <div className="h-32 md:h-44 flex items-center justify-center">
                <img src={settings.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo" />
              </div>
            ) : (
              <div className="w-24 h-24 flex items-center justify-center text-primary text-5xl font-black mx-auto">ف</div>
            )}
          </div>
          <CardTitle className="text-4xl font-black text-zinc-900 tracking-tight">
            {isLogin ? "دخول المنصة" : "التسجيل في " + (settings?.siteTitle || "فهمت")}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-8 md:px-12 pb-10">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black">البريد الإلكتروني</Label>
                <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-16 rounded-2xl border-2 font-black text-lg" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <Label className="font-black">كلمة المرور</Label>
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-primary shadow-xl shadow-primary/20">
                {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تسجيل الدخول"}
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              {step === 'info' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label className="font-black">الاسم الأول</Label>
                      <Input placeholder="أحمد" value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="h-14 rounded-xl border-2 font-bold" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="font-black">الاسم الأخير</Label>
                      <Input placeholder="محمد" value={lastName} onChange={(e)=>setLastName(e.target.value)} className="h-14 rounded-xl border-2 font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <Label className="font-black">الدولة ورقم الهاتف</Label>
                      <div className="flex gap-2" dir="ltr">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[110px] h-14 rounded-xl border-2 font-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={`${c.code}-${c.name}`} value={c.code} className="font-bold">
                                <span className="ml-2">{c.flag}</span> +{c.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder={"رقم الهاتف"} 
                          maxLength={selectedCountry?.length}
                          value={phoneNumber} 
                          onChange={(e)=>setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                          className="h-14 flex-1 rounded-xl border-2 font-black text-lg text-left" 
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold">اكتب الرقم بدون مفتاح الدولة (بحد أقصى {selectedCountry?.length} أرقام)</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <Label className="font-black">تاريخ الميلاد</Label>
                      <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="h-14 rounded-xl border-2 font-black" />
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <Label className="font-black">البريد الإلكتروني</Label>
                    <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-14 rounded-xl border-2 font-bold" />
                  </div>

                  <div className="space-y-2 text-right">
                    <Label className="font-black">كلمة المرور</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e)=>setPassword(e.target.value)} 
                        required 
                        className="h-14 rounded-xl border-2 font-black pr-6" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <Progress value={passwordStrength} className={cn("h-1.5 rounded-full transition-all", 
                        passwordStrength < 40 ? "bg-red-100" : passwordStrength < 80 ? "bg-yellow-100" : "bg-green-100"
                      )} />
                      <p className="text-[10px] font-bold text-muted-foreground">
                        قوة كلمة المرور: {passwordStrength < 40 ? "ضعيفة" : passwordStrength < 80 ? "متوسطة" : "قوية"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <Label className="font-black">تأكيد كلمة المرور</Label>
                    <Input 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e)=>setConfirmPassword(e.target.value)} 
                      required 
                      className="h-14 rounded-xl border-2 font-black pr-6" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-3">
                      <Label className="text-xs font-black block text-center">نوع الحساب</Label>
                      <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex justify-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                          <RadioGroupItem value="mustafhem" id="r1" />
                          <Label htmlFor="r1" className="text-[10px] font-black cursor-pointer">مستفهم</Label>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                          <RadioGroupItem value="mufhem" id="r2" />
                          <Label htmlFor="r2" className="text-[10px] font-black cursor-pointer">مفهم</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border-2 border-dashed space-y-3">
                      <Label className="text-xs font-black block text-center">الجنس</Label>
                      <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex justify-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                          <RadioGroupItem value="male" id="g1" />
                          <Label htmlFor="g1" className="text-[10px] font-black cursor-pointer">ذكر</Label>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                          <RadioGroupItem value="female" id="g2" />
                          <Label htmlFor="g2" className="text-[10px] font-black cursor-pointer">أنثى</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/10 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-primary font-black text-sm">
                      <ShieldCheck size={18} /> <span>اختر وسيلة تأكيد الحساب</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setOtpMethod('whatsapp')} variant={otpMethod === 'whatsapp' ? 'default' : 'outline'} className={`h-12 rounded-xl font-black text-sm transition-all ${otpMethod === 'whatsapp' ? 'bg-primary shadow-md' : 'bg-white'}`}>
                        <MessageSquare size={16} className="ml-2"/> واتساب
                      </Button>
                      <Button onClick={() => setOtpMethod('email')} variant={otpMethod === 'email' ? 'default' : 'outline'} className={`h-12 rounded-xl font-black text-sm transition-all ${otpMethod === 'email' ? 'bg-primary shadow-md' : 'bg-white'}`}>
                        <Mail size={16} className="ml-2"/> بريد
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-2xl border-2 border-dashed border-primary/10">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)} className="mt-1" />
                    <Label htmlFor="terms" className="text-xs font-bold leading-relaxed cursor-pointer select-none text-right">
                      أوافق على <Link href="/terms" target="_blank" className="text-primary underline">شروط الاستخدام</Link> و <Link href="/privacy" target="_blank" className="text-primary underline">سياسة الخصوصية</Link>.
                    </Label>
                  </div>

                  <Button onClick={handleStartSignUp} disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-accent shadow-xl shadow-accent/20">
                    {isProcessing ? <><Loader2 className="animate-spin ml-3 h-8 w-8" /> جاري التحضير...</> : "التسجيل الآن"}
                  </Button>
                </div>
              )}

              {step === 'verify' && (
                <div className="space-y-10 animate-in slide-in-from-left duration-500 py-10">
                  <div className="text-center space-y-4">
                    <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-accent animate-pulse">
                      <ShieldCheck size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-zinc-900">أدخل رمز التحقق</h3>
                    <p className="text-lg font-bold text-zinc-500">تحقق من {otpMethod === 'whatsapp' ? 'الواتساب' : 'البريد'} وأدخل الرمز للمتابعة.</p>
                  </div>
                  <div className="space-y-6">
                    <Input maxLength={6} placeholder="0 0 0 0 0 0" className="h-24 text-5xl font-black text-center tracking-[0.4em] rounded-[2rem] border-4 border-accent/20 bg-zinc-50" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                    <Button onClick={handleVerifyAndRegister} disabled={isProcessing} className="w-full h-20 text-2xl font-black rounded-3xl bg-accent shadow-2xl">
                      {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تأكيد وتفعيل الحساب"}
                    </Button>
                    <Button variant="ghost" onClick={() => setStep('info')} className="w-full font-black text-zinc-400">تعديل البيانات</Button>
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
    <Suspense fallback={<div className="p-20 text-center animate-pulse">جاري تحميل المنصة...</div>}>
      <LoginContent />
    </Suspense>
  );
}
