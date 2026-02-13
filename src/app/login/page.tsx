
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
import { Upload, UserCircle } from "lucide-react";

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
        toast({ variant: "destructive", title: "خطأ في الدخول", description: "البيانات غير صحيحة." });
        setIsProcessing(false);
      });
    } else {
      if (!fullName || !phoneNumber || !birthDate || !email || !password || !profilePictureUrl) {
        toast({ 
          variant: "destructive", 
          title: "بيانات ناقصة", 
          description: "كافة الحقول بما فيها الصورة الشخصية إجبارية لإتمام التسجيل." 
        });
        setIsProcessing(false);
        return;
      }

      initiateEmailSignUp(auth, email, password).catch((err: any) => {
        toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء الحساب." });
        setIsProcessing(false);
      });
    }
  };

  useEffect(() => {
    if (user && firestore && !isLogin) {
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
            createdAt: new Date().toISOString()
          }).then(() => {
            router.push("/");
          });
        }
      });
    }
  }, [user, isLogin, firestore, fullName, phoneNumber, role, gender, profilePictureUrl, birthDate, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f8fafc]" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl border-t-8 border-primary rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto mb-4">
            {settings?.logoUrl ? <img src={settings.logoUrl} className="h-16 mx-auto" /> : <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto">ف</div>}
          </div>
          <CardTitle className="text-3xl font-black text-primary">{isLogin ? "مرحباً بك مجدداً" : "انضم لعائلة فهمني"}</CardTitle>
          <CardDescription className="font-bold">{isLogin ? "ادخل لمتابعة استفهاماتك" : "ابدأ رحلة التعلم الذكية اليوم (جميع الحقول إجبارية)"}</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-5">
                <div className="flex flex-col items-center">
                  <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className={`h-28 w-28 border-4 ${profilePictureUrl ? 'border-primary' : 'border-dashed border-muted-foreground/30'}`}>
                      <AvatarImage src={profilePictureUrl} />
                      <AvatarFallback className="bg-muted/30"><UserCircle className="h-16 w-16 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full text-white shadow-lg"><Upload size={16}/></div>
                  </div>
                  <Label className="mt-2 text-xs font-black text-primary">الصورة الشخصية (إجباري)</Label>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-black text-xs mr-2">الاسم الكامل (إجباري)</Label>
                  <Input placeholder="أدخل اسمك الثلاثي" value={fullName} onChange={(e)=>setFullName(e.target.value)} required className="h-12 rounded-xl border-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black text-xs mr-2">رقم الهاتف (إجباري)</Label>
                    <Input placeholder="01xxxxxxxxx" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required className="h-12 rounded-xl border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs mr-2">تاريخ الميلاد (إجباري)</Label>
                    <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} required className="h-12 rounded-xl border-2" />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl space-y-3 border-2 border-dashed">
                  <Label className="font-black text-sm">نوع الحساب</Label>
                  <RadioGroup value={role} onValueChange={(v:any)=>setRole(v)} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="mustafhem" id="r1"/><Label htmlFor="r1" className="font-bold">مُستفهم</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="mufhem" id="r2"/><Label htmlFor="r2" className="font-bold">مُفهم</Label></div>
                  </RadioGroup>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl space-y-3 border-2 border-dashed">
                  <Label className="font-black text-sm">الجنس</Label>
                  <RadioGroup value={gender} onValueChange={(v:any)=>setGender(v)} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="male" id="g1"/><Label htmlFor="g1" className="font-bold">ذكر</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="female" id="g2"/><Label htmlFor="g2" className="font-bold">أنثى</Label></div>
                  </RadioGroup>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-12 rounded-xl border-2" />
            </div>

            <div className="space-y-2">
              <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-12 rounded-xl border-2" />
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full h-14 text-xl font-black rounded-2xl shadow-xl">
              {isProcessing ? "جاري المعالجة..." : (isLogin ? "دخول" : "إنشاء حساب الآن")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-6 bg-muted/5">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary">
            {isLogin ? "ليس لديك حساب؟ سجل كـ مُستفهم أو مُفهم" : "لديك حساب بالفعل؟ ادخل"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
