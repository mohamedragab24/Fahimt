
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
import { Upload } from "lucide-react";

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
              {isLogin ? "دخول المستخدمين" : "أنشئ حسابك الآن"}
            </CardTitle>
            <CardDescription className="text-lg">
              {isLogin ? "مرحباً بك مجدداً في فهمني" : "خطوة واحدة لتبدأ رحلتك التعليمية"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-md">
                      <AvatarImage src={profilePictureUrl} />
                      <AvatarFallback className="text-xl font-bold">صورة</AvatarFallback>
                    </Avatar>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="secondary" 
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <Label className="font-bold text-muted-foreground">صورة الملف الشخصي (اختياري)</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">الاسم الكامل</Label>
                    <Input placeholder="أحمد محمد" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">رقم الهاتف</Label>
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

            <Button type="submit" disabled={isProcessing} className="w-full font-black text-xl py-8 rounded-2xl shadow-xl">
              {isProcessing ? "جاري المعالجة..." : (isLogin ? "دخول" : "إنشاء حساب")}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center border-t bg-muted/20 py-6">
          <Button variant="link" onClick={() => { setIsLogin(!isLogin); setIsProcessing(false); }} className="text-primary font-bold">
            {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب؟ ادخل من هنا"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
