
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
import { sendEmailVerification } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, UserCircle, Mail, ShieldCheck, CheckCircle2, Loader2, KeyRound, UserPlus, LogIn, ChevronRight, Lock, Calendar } from "lucide-react";
import Link from "next/link";

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
  const [isVerifySent, setIsVerifySent] = useState(false);

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
    if (user && !isUserLoading && !isVerifySent && isLogin) {
      router.push("/");
    }
  }, [user, isUserLoading, router, isVerifySent, isLogin]);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (isLogin) {
      initiateEmailSignIn(auth, email, password).catch((err: any) => {
        toast({ variant: "destructive", title: "خطأ في الدخول", description: "البريد أو كلمة المرور غير صحيحة." });
        setIsProcessing(false);
      });
    } else {
      if (!fullName || !phoneNumber || !birthDate || !profilePictureUrl || !email || !password) {
        toast({ 
          variant: "destructive", 
          title: "بيانات ناقصة", 
          description: "يرجى تعبئة كافة الحقول بما فيها الصورة الشخصية لإتمام التسجيل." 
        });
        setIsProcessing(false);
        return;
      }

      try {
        const cred = await initiateEmailSignUp(auth, email, password);
        if (cred.user) {
          await sendEmailVerification(cred.user);
          setIsVerifySent(true);
          toast({ title: "تم إنشاء الحساب", description: "أرسلنا رابط التحقق لبريدك الإلكتروني، يرجى تفعيله." });
        }
      } catch (err: any) {
        console.error(err);
        toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء الحساب، ربما البريد مستخدم مسبقاً." });
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (user && firestore && !isLogin && isVerifySent) {
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
            emailVerified: false,
            createdAt: new Date().toISOString()
          });
        }
      });
    }
  }, [user, isLogin, firestore, fullName, phoneNumber, role, gender, profilePictureUrl, birthDate, isVerifySent]);

  if (isVerifySent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
        <Card className="w-full max-w-lg shadow-2xl rounded-[3.5rem] bg-white p-12 text-center space-y-8 animate-in fade-in">
          <div className="bg-primary/10 w-28 h-28 rounded-full flex items-center justify-center mx-auto text-primary">
            <Mail size={56} className="animate-bounce" />
          </div>
          <h2 className="text-4xl font-black text-zinc-900">تفقد بريدك الإلكتروني</h2>
          <p className="text-xl font-bold text-muted-foreground leading-relaxed">
            لقد أرسلنا رابط تفعيل رسمي لبريدك: <br/> <strong>{email}</strong> <br/>
            يرجى الضغط على الرابط لتتمكن من استخدام كافة مميزات المنصة.
          </p>
          <Button asChild className="w-full h-16 rounded-2xl text-2xl font-black shadow-xl bg-primary">
            <Link href="/login" onClick={() => window.location.reload()}>عدت بعد التحقق؟ سجل دخولك</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_30px_80px_rgba(0,0,0,0.12)] border-none rounded-[3.5rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center pt-10 pb-4 space-y-6">
          <div className="mx-auto group transition-transform hover:scale-105 duration-500">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-32 md:h-40 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mx-auto shadow-2xl">ف</div>
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl md:text-4xl font-black text-zinc-900 flex items-center justify-center gap-3">
              {isLogin ? <LogIn className="text-primary h-8 w-8" /> : <UserPlus className="text-accent h-8 w-8" />}
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
            </CardTitle>
            <CardDescription className="text-lg font-bold text-muted-foreground">
              {isLogin ? "أهلاً بك في عالم الفهم والتميز" : "ابدأ رحلتك التعليمية معنا الآن"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* 1. الصورة الشخصية */}
                <div className="flex flex-col items-center py-2">
                  <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className={`h-36 w-36 border-8 transition-all ${profilePictureUrl ? 'border-primary/20' : 'border-dashed border-zinc-200'}`}>
                      <AvatarImage src={profilePictureUrl} />
                      <AvatarFallback className="bg-zinc-50 text-zinc-300"><UserCircle className="h-20 w-20" /></AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 bg-primary p-3 rounded-xl text-white shadow-2xl border-4 border-white transition-transform group-hover:rotate-12"><Upload size={20}/></div>
                  </div>
                  <Label className="mt-4 text-xs font-black text-primary uppercase tracking-[0.2em]">رفع صورتك الشخصية</Label>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                
                {/* 2. الاسم الكامل */}
                <div className="space-y-2">
                  <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">الاسم الكامل <UserCircle size={18} className="text-primary"/></Label>
                  <Input placeholder="أدخل اسمك كما سيظهر للآخرين" value={fullName} onChange={(e)=>setFullName(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg shadow-sm" />
                </div>

                {/* 3. الهاتف و 4. تاريخ الميلاد */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">رقم الهاتف <Smartphone size={18} className="text-primary"/></Label>
                    <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-md mr-2 text-zinc-700 flex items-center gap-2">تاريخ الميلاد <Calendar size={18} className="text-primary"/></Label>
                    <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg shadow-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* 5. البريد الإلكتروني */}
            <div className="space-y-2">
              <Label className="font-black text-md mr-2 flex items-center gap-2 text-zinc-700">
                البريد الإلكتروني <Mail size={18} className="text-primary" />
              </Label>
              <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg bg-zinc-50/50 focus:bg-white shadow-inner" />
            </div>

            {/* 6. كلمة المرور */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <Label className="font-black text-md text-zinc-700 flex items-center gap-2">
                  كلمة المرور <KeyRound size={18} className="text-primary" />
                </Label>
                {isLogin && (
                  <Link href="/forgot-password" size="sm" className="text-xs font-black text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                )}
              </div>
              <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-14 rounded-xl border-2 font-black text-lg bg-zinc-50/50 focus:bg-white shadow-inner" />
            </div>

            {!isLogin && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* 7. نوع الحساب و 8. الجنس */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-[2rem] space-y-3 border border-zinc-100 shadow-sm">
                    <Label className="font-black text-[10px] text-muted-foreground block text-center uppercase tracking-widest">نوع الحساب</Label>
                    <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border hover:border-primary cursor-pointer group">
                        <RadioGroupItem value="mustafhem" id="r1" className="h-4 w-4"/>
                        <Label htmlFor="r1" className="text-sm font-black cursor-pointer group-hover:text-primary">مُستفهم</Label>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border hover:border-primary cursor-pointer group">
                        <RadioGroupItem value="mufhem" id="r2" className="h-4 w-4"/>
                        <Label htmlFor="r2" className="text-sm font-black cursor-pointer group-hover:text-primary">مُفهم</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-[2rem] space-y-3 border border-zinc-100 shadow-sm">
                    <Label className="font-black text-[10px] text-muted-foreground block text-center uppercase tracking-widest">الجنس</Label>
                    <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border hover:border-primary cursor-pointer group">
                        <RadioGroupItem value="male" id="g1" className="h-4 w-4"/>
                        <Label htmlFor="g1" className="text-sm font-black cursor-pointer group-hover:text-primary">ذكر</Label>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border hover:border-primary cursor-pointer group">
                        <RadioGroupItem value="female" id="g2" className="h-4 w-4"/>
                        <Label htmlFor="g2" className="text-sm font-black cursor-pointer group-hover:text-primary">أنثى</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isProcessing} className={`w-full h-16 text-2xl font-black rounded-[1.5rem] shadow-xl transition-all hover:scale-[1.02] active:scale-95 mt-4 ${isLogin ? 'bg-primary' : 'bg-accent'}`}>
              {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : (isLogin ? "دخول المنصة" : "إنشاء الحساب الآن")}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center border-t py-8 bg-zinc-50/50">
          <Button variant="link" onClick={() => { setIsLogin(!isLogin); setIsVerifySent(false); }} className="font-black text-primary text-lg hover:underline flex items-center gap-2">
            {isLogin ? "ليس لديك حساب؟ انضم إلينا" : "لديك حساب بالفعل؟ سجل دخولك"}
            <ChevronRight className={`h-5 w-5 ${!isLogin ? 'rotate-180' : ''}`} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
