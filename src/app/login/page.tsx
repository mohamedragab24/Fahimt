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
import { Camera, Upload, ShieldCheck, CheckCircle2, MessageSquare, Mail, Smartphone } from "lucide-react";
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
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'whatsapp'>('whatsapp');
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
        initiateEmailSignIn(auth, email, password).catch((err: any) => {
          toast({ variant: "destructive", title: "خطأ في الدخول", description: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
        });
      } catch (err: any) {
        toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ غير متوقع." });
      }
      return;
    }

    if (!fullName || !phoneNumber || !birthDate || !email || !password) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال كافة البيانات الإلزامية" });
      return;
    }

    // التحقق من وجود البريد مسبقاً في قاعدة البيانات قبل الإرسال
    if (firestore) {
      setIsVerifying(true);
      const q = query(collection(firestore, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "تنبيه", description: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول." });
        setIsVerifying(false);
        return;
      }
      setIsVerifying(false);
    }

    setShowVerification(true);
    handleSendOTP(verificationMethod);
  };

  const handleSendOTP = async (method: 'email' | 'whatsapp') => {
    setIsVerifying(true);
    setVerificationMethod(method);
    const target = method === 'email' ? email : phoneNumber;
    try {
      const result = await generateAndSendOTP({ recipient: target, method });
      if (result.success && firestore) {
        await addDoc(collection(firestore, "temp_otp"), {
          email,
          code: result.code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
        
        toast({ 
          title: "تم إرسال الرمز", 
          description: `الرمز هو: ${result.code} (يصلك الآن عبر ${method === 'email' ? 'البريد' : 'الواتساب'})` 
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في إرسال الرمز" });
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
        // محاولة إنشاء الحساب مع معالجة الخطأ إذا كان البريد مستخدماً
        initiateEmailSignUp(auth, email, password)
          .then(async () => {
            await deleteDoc(snap.docs[0].ref);
          })
          .catch((err: any) => {
            if (err.code === 'auth/email-already-in-use') {
              toast({ variant: "destructive", title: "خطأ في التسجيل", description: "هذا البريد مسجل بالفعل في النظام." });
            } else {
              toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء الحساب، يرجى المحاولة لاحقاً." });
            }
            setIsVerifying(false);
            setShowVerification(false);
          });
      } else {
        toast({ variant: "destructive", title: "خطأ", description: "رمز التحقق غير صحيح أو انتهت صلاحيته" });
        setIsVerifying(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التحقق" });
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
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-3xl">ف</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-black font-headline">
              {showVerification ? "أدخل رمز التحقق" : (isLogin ? "دخول المسؤولين والمستخدمين" : "أنشئ حسابك الآن")}
            </CardTitle>
            <CardDescription className="text-lg">
              {showVerification ? `تم إرسال الرمز عبر ${verificationMethod === 'email' ? 'البريد' : 'الواتساب'}` : (isLogin ? "مرحباً بك مجدداً في فهمني" : "خطوة واحدة لتبدأ رحلتك التعليمية")}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          {showVerification ? (
            <div className="space-y-8 animate-in fade-in">
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
                {isVerifying ? "جاري التحقق..." : "تأكيد الدخول"}
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleSendOTP('whatsapp')} className="rounded-xl h-12 gap-2">
                  <MessageSquare className="h-4 w-4" /> واتساب
                </Button>
                <Button variant="outline" onClick={() => handleSendOTP('email')} className="rounded-xl h-12 gap-2">
                  <Mail className="h-4 w-4" /> بريد إلكتروني
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartSignUp} className="space-y-6">
              {!isLogin && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">الاسم الكامل</Label>
                      <Input placeholder="أحمد محمد" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">رقم الواتساب</Label>
                      <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">تاريخ الميلاد</Label>
                    <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-2xl">
                    <Label className="font-bold text-primary">نوع الحساب</Label>
                    <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex gap-6">
                      <div className="flex items-center space-x-2 space-x-reverse bg-white px-4 py-2 rounded-xl border-2 border-transparent data-[state=checked]:border-primary cursor-pointer">
                        <RadioGroupItem value="mustafhem" id="mustafhem" />
                        <Label htmlFor="mustafhem" className="cursor-pointer font-bold">مُستفهم</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse bg-white px-4 py-2 rounded-xl border-2 border-transparent data-[state=checked]:border-primary cursor-pointer">
                        <RadioGroupItem value="mufhem" id="mufhem" />
                        <Label htmlFor="mufhem" className="cursor-pointer font-bold">مُفهم</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">البريد الإلكتروني</Label>
                  <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">كلمة المرور</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
              </div>

              <Button type="submit" disabled={isVerifying} className="w-full font-black text-xl py-8 rounded-2xl shadow-xl">
                {isVerifying ? "جاري المعالجة..." : (isLogin ? "دخول" : "إرسال رمز التحقق")}
              </Button>
            </form>
          )}
        </CardContent>
        
        {!showVerification && (
          <CardFooter className="justify-center border-t bg-muted/20 py-6">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold">
              {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب؟ ادخل من هنا"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
