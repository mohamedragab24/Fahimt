
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirebase, useUser } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, ShieldCheck, CheckCircle2, MessageSquare, Mail } from "lucide-react";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading && !showVerification) {
      router.push("/");
    }
  }, [user, isUserLoading, router, showVerification]);

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

  const handleStartSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      try {
        initiateEmailSignIn(auth, email, password);
      } catch (err: any) {
        toast({ variant: "destructive", title: "خطأ", description: err.message });
      }
      return;
    }

    if (!fullName || !phoneNumber || !birthDate || !profilePictureUrl || !email || !password) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال كافة البيانات" });
      return;
    }

    setShowVerification(true);
    handleSendOTP('whatsapp');
  };

  const handleSendOTP = async (method: 'email' | 'whatsapp') => {
    setIsVerifying(true);
    const target = method === 'email' ? email : phoneNumber;
    try {
      const result = await generateAndSendOTP({ recipient: target, method });
      if (result.success && firestore) {
        await addDoc(collection(firestore, "temp_otp"), {
          email,
          code: result.code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
        
        // إظهار الكود في التنبيه لأغراض التجربة
        toast({ 
          title: "تم إرسال الرمز (محاكاة)", 
          description: `الرمز هو: ${result.code} (سيتم إرساله حقيقة عند ربط API)` 
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال رمز التحقق" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAndComplete = async () => {
    if (!firestore || !otpCode) return;
    setIsVerifying(true);
    
    try {
      const q = query(
        collection(firestore, "temp_otp"), 
        where("email", "==", email), 
        where("code", "==", otpCode)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        initiateEmailSignUp(auth, email, password);
        await deleteDoc(snap.docs[0].ref);
      } else {
        toast({ variant: "destructive", title: "خطأ", description: "رمز التحقق غير صحيح" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل التحقق" });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (user && firestore && !isLogin) {
      const userRef = doc(firestore, "users", user.uid);
      const adminEmail = "mohamed76y@gmail.com";
      const isTargetAdmin = user.email === adminEmail;

      getDoc(userRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(userRef, {
            id: user.uid,
            fullName,
            email: user.email,
            phoneNumber,
            role,
            isVerified: true,
            birthDate: birthDate ? new Date(birthDate).toISOString() : new Date().toISOString(),
            profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${user.uid}/200/200`,
            isAdmin: isTargetAdmin,
            adminPermissions: isTargetAdmin ? ["superadmin"] : []
          }).then(() => {
            setShowVerification(false);
            router.push("/");
          });
        }
      });
    }
  }, [user, isLogin, firestore, fullName, phoneNumber, role, profilePictureUrl, birthDate, router]);

  if (isUserLoading) return <div className="flex h-screen items-center justify-center font-bold animate-pulse">جاري التحميل...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-t-8 border-primary rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <span className="text-white font-black text-3xl">ف</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-black font-headline">
              {showVerification ? "تحقق من هويتك" : (isLogin ? "مرحباً بك مجدداً" : "انضم إلى مجتمعنا")}
            </CardTitle>
            <CardDescription className="text-lg">
              {showVerification ? "أدخل الرمز الذي ظهر لك في التنبيه" : (isLogin ? "ادخل لمتابعة رحلة تعلمك" : "أنشئ حساباً لتبدأ التعليم أو التعلم")}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          {showVerification ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 text-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
                <p className="font-bold text-muted-foreground">استخدم الكود الذي ظهر في التنبيه بالأعلى</p>
              </div>
              <div className="space-y-4">
                <Input 
                  placeholder="000000" 
                  className="h-20 text-4xl text-center font-black rounded-2xl border-2 tracking-[0.5em]" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                />
                <Button 
                  onClick={handleVerifyAndComplete} 
                  disabled={isVerifying || otpCode.length < 6}
                  className="w-full py-8 text-2xl font-black rounded-2xl shadow-xl"
                >
                  {isVerifying ? "جاري التحقق..." : "تأكيد وإنشاء الحساب"}
                </Button>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button variant="outline" onClick={() => handleSendOTP('whatsapp')} className="rounded-xl h-12 gap-2">
                    <MessageSquare className="h-4 w-4" /> إعادة واتساب
                  </Button>
                  <Button variant="outline" onClick={() => handleSendOTP('email')} className="rounded-xl h-12 gap-2">
                    <Mail className="h-4 w-4" /> إعادة بريد
                  </Button>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowVerification(false)} className="w-full text-muted-foreground">تعديل البيانات</Button>
            </div>
          ) : (
            <form onSubmit={handleStartSignUp} className="space-y-6">
              {!isLogin && (
                <div className="flex flex-col items-center gap-6 mb-8 p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                      <AvatarImage src={profilePictureUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                        {fullName?.charAt(0) || <Camera />}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      type="button"
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 rounded-xl h-10 w-10 shadow-lg"
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                  </div>
                  <div className="text-center">
                    <Label className="text-primary font-bold">صورة الملف الشخصي</Label>
                    <p className="text-xs text-muted-foreground mt-1">يرجى اختيار صورة من جهازك</p>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold mr-2 text-muted-foreground">الاسم الكامل</Label>
                    <Input id="name" placeholder="أحمد محمد" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold mr-2 text-muted-foreground">رقم الواتساب</Label>
                    <Input id="phone" placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="col-span-full space-y-2">
                    <Label htmlFor="birthDate" className="font-bold mr-2 text-muted-foreground">تاريخ الميلاد</Label>
                    <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-2xl">
                  <Label className="font-bold mr-2 text-primary">نوع الحساب</Label>
                  <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex gap-6">
                    <div className="flex items-center space-x-2 space-x-reverse bg-white px-4 py-2 rounded-xl border-2 border-transparent data-[state=checked]:border-primary transition-all cursor-pointer">
                      <RadioGroupItem value="mustafhem" id="mustafhem" />
                      <Label htmlFor="mustafhem" className="cursor-pointer font-bold">أتعلم (مُستفهم)</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-white px-4 py-2 rounded-xl border-2 border-transparent data-[state=checked]:border-primary transition-all cursor-pointer">
                      <RadioGroupItem value="mufhem" id="mufhem" />
                      <Label htmlFor="mufhem" className="cursor-pointer font-bold">أعلّم (مُفهم)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold mr-2 text-muted-foreground">البريد الإلكتروني</Label>
                  <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold mr-2 text-muted-foreground">كلمة المرور</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
              </div>

              <Button type="submit" className="w-full font-black text-xl py-8 rounded-2xl mt-6 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                {isLogin ? "دخول" : "إنشاء حساب مجاناً"}
              </Button>
            </form>
          )}
        </CardContent>
        
        {!showVerification && (
          <CardFooter className="justify-center border-t bg-muted/20 py-6">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold text-md">
              {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ ادخل من هنا"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
