
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
import { 
  Upload, 
  UserCircle, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  ChevronRight, 
  Lock, 
  Calendar,
  Smartphone,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'info' | 'verify' | 'final'>('info');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phoneNumber, setPhoneNumber] = useState("");
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
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول." });
      return;
    }
    setIsProcessing(true);
    try {
      const recipient = otpMethod === 'whatsapp' ? phoneNumber : email;
      const result = await generateAndSendOTP({ recipient, method: otpMethod });
      if (result.success) {
        setGeneratedCode(result.code);
        setStep('verify');
        toast({ title: "تم إرسال الرمز", description: `تحقق من ${otpMethod === 'whatsapp' ? 'الواتساب' : 'البريد'}.` });
      } else {
        toast({ variant: "destructive", title: "فشل الإرسال", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ تقني" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode !== generatedCode) {
      toast({ variant: "destructive", title: "رمز خاطئ", description: "يرجى التأكد من الرمز والمحاولة ثانية." });
      return;
    }
    setIsProcessing(true);
    try {
      const cred = await initiateEmailSignUp(auth, email, password);
      if (cred.user) {
        const userRef = doc(firestore!, "users", cred.user.uid);
        await setDoc(userRef, {
          id: cred.user.uid,
          fullName,
          email,
          phoneNumber,
          role,
          gender,
          isProfileApproved: false,
          birthDate: new Date(birthDate).toISOString(),
          profilePictureUrl,
          status: "active",
          emailVerified: true,
          createdAt: new Date().toISOString()
        });
        toast({ title: "تم التسجيل بنجاح!" });
        router.push("/");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    initiateEmailSignIn(auth, email, password).catch((err: any) => {
      toast({ variant: "destructive", title: "خطأ في الدخول", description: "البيانات غير صحيحة." });
      setIsProcessing(false);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_30px_80px_rgba(0,0,0,0.12)] border-none rounded-[3.5rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center pt-10 pb-4 space-y-6">
          <div className="mx-auto transition-transform hover:scale-105 duration-500">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-32 md:h-40 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mx-auto shadow-2xl">ف</div>
            )}
          </div>
          <CardTitle className="text-3xl md:text-4xl font-black text-zinc-900 flex items-center justify-center gap-3">
            {isLogin ? <LogIn className="text-primary h-8 w-8" /> : <UserPlus className="text-accent h-8 w-8" />}
            {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-10 pb-10">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-md mr-2 flex items-center gap-2">البريد الإلكتروني <Mail size={18} className="text-primary" /></Label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <Label className="font-black text-md flex items-center gap-2">كلمة المرور <KeyRound size={18} className="text-primary" /></Label>
                  <Link href="/forgot-password" size="sm" className="text-xs font-black text-primary hover:underline">نسيت كلمة المرور؟</Link>
                </div>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg" />
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full h-16 text-2xl font-black rounded-2xl shadow-xl bg-primary">
                {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "دخول المنصة"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {step === 'info' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex flex-col items-center py-2">
                    <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className={`h-36 w-36 border-8 ${profilePictureUrl ? 'border-primary/20' : 'border-dashed border-zinc-200'}`}>
                        <AvatarImage src={profilePictureUrl} />
                        <AvatarFallback className="bg-zinc-50"><UserCircle className="h-20 w-20 text-zinc-300" /></AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-1 right-1 bg-primary p-3 rounded-xl text-white shadow-2xl border-4 border-white"><Upload size={20}/></div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  
                  <div className="space-y-4">
                    <Input placeholder="الاسم الكامل" value={fullName} onChange={(e)=>setFullName(e.target.value)} className="h-14 rounded-xl border-2 font-black" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="رقم الهاتف (واتساب)" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} className="h-14 rounded-xl border-2 font-black" />
                      <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} className="h-14 rounded-xl border-2 font-black" />
                    </div>
                    <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} className="h-14 rounded-xl border-2 font-black" />
                    <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} className="h-14 rounded-xl border-2 font-black" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-2xl border">
                      <Label className="text-[10px] font-black text-muted-foreground block mb-2">نوع الحساب</Label>
                      <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2"><RadioGroupItem value="mustafhem" id="r1" /><Label htmlFor="r1" className="text-xs font-black">مُستفهم</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="mufhem" id="r2" /><Label htmlFor="r2" className="text-xs font-black">مُفهم</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border">
                      <Label className="text-[10px] font-black text-muted-foreground block mb-2">الجنس</Label>
                      <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2"><RadioGroupItem value="male" id="g1" /><Label htmlFor="g1" className="text-xs font-black">ذكر</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="female" id="g2" /><Label htmlFor="g2" className="text-xs font-black">أنثى</Label></div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-black text-xs text-center block">اختر وسيلة استلام رمز التحقق</Label>
                    <div className="flex gap-2">
                      <Button onClick={() => setOtpMethod('whatsapp')} variant={otpMethod === 'whatsapp' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12 font-black"><MessageSquare size={16} className="ml-2"/> واتساب</Button>
                      <Button onClick={() => setOtpMethod('email')} variant={otpMethod === 'email' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12 font-black"><Mail size={16} className="ml-2"/> بريد</Button>
                    </div>
                  </div>

                  <Button onClick={handleStartSignUp} disabled={isProcessing} className="w-full h-16 text-xl font-black rounded-2xl bg-accent">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "إرسال رمز التحقق"}
                  </Button>
                </div>
              )}

              {step === 'verify' && (
                <div className="space-y-8 animate-in slide-in-from-left">
                  <div className="text-center space-y-2">
                    <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-accent"><ShieldCheck size={40} /></div>
                    <h3 className="text-2xl font-black">أدخل رمز التحقق</h3>
                    <p className="text-sm font-bold text-muted-foreground">أرسلنا الرمز المكون من 6 أرقام إلى {otpMethod === 'whatsapp' ? 'واتساب' : 'بريد'} {otpMethod === 'whatsapp' ? phoneNumber : email}</p>
                  </div>
                  <Input 
                    maxLength={6} 
                    className="h-20 text-4xl font-black text-center tracking-[0.5em] rounded-2xl border-4 border-accent/20 focus:border-accent"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <Button onClick={handleVerifyAndRegister} disabled={isProcessing} className="w-full h-16 text-xl font-black rounded-2xl bg-accent shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "تأكيد وإنشاء الحساب"}
                  </Button>
                  <Button variant="ghost" onClick={() => setStep('info')} className="w-full font-bold">تعديل البيانات</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t py-8 bg-zinc-50/50">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="font-black text-primary text-lg flex items-center gap-2">
            {isLogin ? "ليس لديك حساب؟ انضم إلينا" : "لديك حساب بالفعل؟ سجل دخولك"}
            <ChevronRight className={`h-5 w-5 ${!isLogin ? 'rotate-180' : ''}`} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
