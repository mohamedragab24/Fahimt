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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (isLogin) {
      initiateEmailSignIn(auth, email, password).catch((err: any) => {
        toast({ variant: "destructive", title: "خطأ في الدخول", description: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
        setIsProcessing(false);
      });
    } else {
      if (!fullName || !phoneNumber || !birthDate || !email || !password) {
        toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال كافة البيانات الإلزامية" });
        setIsProcessing(false);
        return;
      }

      initiateEmailSignUp(auth, email, password).catch((err: any) => {
        if (err.code === 'auth/email-already-in-use') {
          toast({ variant: "destructive", title: "خطأ في التسجيل", description: "هذا البريد مسجل بالفعل في النظام." });
        } else {
          toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء الحساب، يرجى المحاولة لاحقاً." });
        }
        setIsProcessing(false);
      });
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
            adminPermissions: isTargetAdmin ? ["superadmin"] : [],
            status: "active",
            createdAt: new Date().toISOString()
          }).then(() => {
            router.push("/");
          });
        }
      });
    }
  }, [user, isLogin, firestore, fullName, phoneNumber, role, profilePictureUrl, birthDate, router]);

  if (isUserLoading) return <div className="flex h-screen items-center justify-center font-black animate-pulse text-primary text-2xl">جاري التحميل...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-primary/5" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-t-[12px] border-primary rounded-[3rem] bg-white overflow-hidden relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>
        <CardHeader className="text-center space-y-4 pt-12 relative z-10">
          <div className="mx-auto bg-primary w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative group transition-transform hover:scale-110">
            <span className="text-white font-black text-4xl">ف</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full border-4 border-white shadow-md group-hover:animate-bounce"></div>
          </div>
          <div>
            <CardTitle className="text-4xl font-black font-headline text-primary tracking-tight">
              {isLogin ? "دخول " : "حساب جديد"}
            </CardTitle>
            <CardDescription className="text-xl font-bold text-muted-foreground mt-2">
              {isLogin ? "مرحباً بك مجدداً في فهمني" : "ابدأ رحلة التعلم الذكية اليوم"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 pb-10 relative z-10">
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-xl transition-transform group-hover:scale-105">
                      <AvatarImage src={profilePictureUrl} />
                      <AvatarFallback className="text-2xl font-black bg-primary/5 text-primary">صورة</AvatarFallback>
                    </Avatar>
                    <Button 
                      type="button" 
                      size="icon" 
                      className="absolute bottom-0 right-0 rounded-2xl h-10 w-10 shadow-xl bg-accent hover:bg-accent/90 border-2 border-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <Label className="font-black text-primary/60">صورة الحساب (اختياري)</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black pr-2">الاسم الكامل</Label>
                    <Input placeholder="أحمد محمد" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-14 rounded-2xl border-2 focus:border-primary px-6 text-lg font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black pr-2">رقم الهاتف</Label>
                    <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="h-14 rounded-2xl border-2 focus:border-primary px-6 text-lg font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-black pr-2">تاريخ الميلاد</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="h-14 rounded-2xl border-2 focus:border-primary px-6 text-lg font-bold" />
                </div>
                <div className="space-y-3 p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 shadow-inner">
                  <Label className="font-black text-primary text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> نوع الحساب
                  </Label>
                  <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex gap-6">
                    <div className="flex items-center space-x-2 space-x-reverse bg-white px-6 py-3 rounded-2xl border-2 border-transparent data-[state=checked]:border-primary shadow-sm cursor-pointer transition-all hover:shadow-md">
                      <RadioGroupItem value="mustafhem" id="mustafhem" />
                      <Label htmlFor="mustafhem" className="cursor-pointer font-black text-lg">مُستفهم</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-white px-6 py-3 rounded-2xl border-2 border-transparent data-[state=checked]:border-accent shadow-sm cursor-pointer transition-all hover:shadow-md">
                      <RadioGroupItem value="mufhem" id="mufhem" className="data-[state=checked]:border-accent data-[state=checked]:text-accent" />
                      <Label htmlFor="mufhem" className="cursor-pointer font-black text-lg">مُفهم</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-black pr-2">البريد الإلكتروني</Label>
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-14 rounded-2xl border-2 focus:border-primary px-6 text-lg font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-black pr-2">كلمة المرور</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-14 rounded-2xl border-2 focus:border-primary px-6 text-lg font-bold" />
              </div>
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full font-black text-2xl py-10 rounded-[2rem] shadow-[0_20px_40px_rgba(41,182,246,0.2)] hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90">
              {isProcessing ? "جاري العمل..." : (isLogin ? "دخول" : "ابدأ الآن")}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center border-t bg-primary/5 py-8">
          <Button variant="link" onClick={() => { setIsLogin(!isLogin); setIsProcessing(false); }} className="text-primary font-black text-lg hover:text-accent">
            {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب؟ ادخل من هنا"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
