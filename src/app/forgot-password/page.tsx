
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { doc } from "firebase/firestore";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSent, setIsEmailSent] = useState(false);
  
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const handleSendResetLink = async () => {
    if (!email || !email.includes("@")) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsEmailSent(true);
      toast({ title: "تم إرسال الرابط", description: "تفقد بريدك الإلكتروني الآن لإعادة تعيين كلمة المرور." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "لم نجد حساباً مسجلاً بهذا البريد." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_30px_80px_rgba(0,0,0,0.12)] border-none rounded-[3.5rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pt-14 pb-8 space-y-8">
          <div className="mx-auto scale-110">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-36 md:h-48 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="bg-primary/10 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary">
                <ShieldCheck size={56} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black text-zinc-900">استعادة الوصول</CardTitle>
            <CardDescription className="text-xl font-bold text-muted-foreground px-10">
              سوف نرسل لك رابطاً آمناً لإعادة تعيين كلمة مرورك عبر البريد الإلكتروني.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-12 pb-10">
          {!isSent ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <Label className="font-black text-lg text-zinc-700 mr-2 flex items-center gap-3">
                  <Mail size={22} className="text-primary" /> البريد الإلكتروني للحساب
                </Label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="h-16 rounded-2xl border-2 focus:border-primary text-xl font-black bg-zinc-50/50 shadow-inner"
                />
              </div>

              <Button 
                onClick={handleSendResetLink} 
                disabled={isProcessing} 
                className="w-full h-20 rounded-3xl font-black text-2xl bg-primary shadow-2xl hover:scale-[1.02] transition-all"
              >
                {isProcessing ? <Loader2 className="animate-spin ml-2" /> : "إرسال رابط الاستعادة"}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-8 py-10 animate-in slide-in-from-bottom-4">
              <div className="bg-green-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 size={64} className="animate-bounce" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-zinc-800">تفقد بريدك الآن</h3>
                <p className="text-lg text-muted-foreground font-bold leading-relaxed px-6">
                  لقد أرسلنا رابطاً رسمياً لتعيين كلمة المرور الجديدة لبريدك: <strong>{email}</strong>
                </p>
              </div>
              <Button asChild className="w-full h-16 rounded-2xl text-2xl font-black shadow-2xl bg-zinc-900">
                <Link href="/login">العودة لتسجيل الدخول</Link>
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t py-10 bg-zinc-50/50">
          <Button variant="ghost" asChild className="font-black text-zinc-500 hover:text-primary text-xl gap-3">
            <Link href="/login">
              <ChevronRight size={24} className="rotate-180" /> العودة لتسجيل الدخول
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
