
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
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        initiateEmailSignIn(auth, email, password);
      } else {
        if (!fullName || !phoneNumber || !birthDate || !profilePictureUrl) {
          toast({ variant: "destructive", title: "خطأ", description: "يرجى إكمال كافة البيانات بما في ذلك صورة البروفايل" });
          return;
        }
        initiateEmailSignUp(auth, email, password);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, "users", user.uid);
      const adminEmail = "mohamed76y@gmail.com";
      const isTargetAdmin = user.email === adminEmail;

      getDoc(userRef).then((snap) => {
        if (!snap.exists()) {
          // فقط عند إنشاء حساب جديد (isLogin == false)
          if (!isLogin) {
            setDoc(userRef, {
              id: user.uid,
              fullName,
              email: user.email,
              phoneNumber,
              role,
              birthDate: birthDate ? new Date(birthDate).toISOString() : new Date().toISOString(),
              profilePictureUrl: profilePictureUrl || `https://picsum.photos/seed/${user.uid}/200/200`,
              isAdmin: isTargetAdmin,
              adminPermissions: isTargetAdmin ? ["superadmin"] : []
            });
          }
        } else {
          // إذا كان هذا هو البريد المطلوب ولم يكن أدمن بالفعل، قم بترقيته
          const data = snap.data();
          if (isTargetAdmin && !data.isAdmin) {
            updateDoc(userRef, {
              isAdmin: true,
              adminPermissions: ["superadmin"]
            });
          }
        }
      });
    }
  }, [user, isLogin, firestore, fullName, phoneNumber, role, profilePictureUrl, birthDate]);

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
              {isLogin ? "مرحباً بك مجدداً" : "انضم إلى مجتمعنا"}
            </CardTitle>
            <CardDescription className="text-lg">
              {isLogin ? "ادخل لمتابعة رحلة تعلمك" : "أنشئ حساباً لتبدأ التعليم أو التعلم"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
        </CardContent>
        
        <CardFooter className="justify-center border-t bg-muted/20 py-6">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold text-md">
            {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ ادخل من هنا"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
