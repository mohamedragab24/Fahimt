
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, useFirestore } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useUser } from "@/firebase";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"mustafhem" | "mufhem">("mustafhem");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        initiateEmailSignIn(auth, email, password);
      } else {
        // Sign up and then create profile
        initiateEmailSignUp(auth, email, password);
        // Profile creation happens in a separate effect or after login is detected
        // For simplicity in MVP, we handle it if user creation is successful
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    }
  };

  // Profile sync effect
  useEffect(() => {
    if (user && !isLogin) {
      const userRef = doc(firestore, "users", user.uid);
      getDoc(userRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(userRef, {
            id: user.uid,
            fullName,
            email,
            phoneNumber,
            role,
            birthDate: new Date().toISOString(),
            profilePictureUrl: "https://picsum.photos/seed/" + user.uid + "/200/200"
          });
        }
      });
    }
  }, [user, isLogin, firestore, fullName, email, phoneNumber, role]);

  if (isUserLoading) return <div className="flex h-screen items-center justify-center font-bold">جاري التحميل...</div>;

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">ف</span>
          </div>
          <CardTitle className="text-2xl font-headline">{isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}</CardTitle>
          <CardDescription>انضم إلى مجتمع فهمني للتعليم والتعلم</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الواتساب</Label>
                  <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>أنا هنا لـ:</Label>
                  <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="mustafhem" id="mustafhem" />
                      <Label htmlFor="mustafhem">أتعلم (مُستفهم)</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="mufhem" id="mufhem" />
                      <Label htmlFor="mufhem">أعلّم (مُفهم)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-bold text-lg py-6 rounded-xl mt-4">
              {isLogin ? "دخول" : "تسجيل"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ ادخل من هنا"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useFirebase } from "@/firebase";
