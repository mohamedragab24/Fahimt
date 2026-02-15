
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
import { Mail, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { doc } from "firebase/firestore";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إدخال البريد الإلكتروني أولاً." });
      return;
    }

    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "تم إرسال الرابط بنجاح!", 
        description: "يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور." 
      });
      setTimeout(() => router.push("/login"), 3000);
    } catch (error: any) {
      console.error(error);
      let message = "فشل إرسال الرابط، يرجى التأكد من البريد والمحاولة لاحقاً.";
      if (error.code === "auth/user-not-found") {
        message = "عذراً، هذا البريد غير مسجل في المنصة.";
      }
      toast({ variant: "destructive", title: "خطأ في العملية", description: message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none rounded-[3rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pt-12 pb-8 space-y-6">
          <div className="mx-auto">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-24 md:h-32 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner">
                <ShieldCheck size={48} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black text-zinc-900">نسيت كلمة المرور؟</CardTitle>
            <CardDescription className="text-lg font-bold text-muted-foreground px-6">
              لا تقلق، أدخل بريدك الإلكتروني وسنرسل لك رابطاً آمناً لاستعادتها فوراً.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-8">
          <form onSubmit={handleReset} className="space-y-8">
            <div className="space-y-3">
              <Label className="font-black text-zinc-700 mr-2 flex items-center gap-2">
                <Mail size={16} className="text-primary" /> البريد الإلكتروني للمسابقة
              </Label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-16 rounded-2xl border-2 focus:border-primary text-lg font-bold shadow-sm"
              />
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              {isProcessing ? (
                <><Loader2 className="ml-2 animate-spin h-6 w-6" /> جاري الإرسال...</>
              ) : (
                "إرسال رابط الاستعادة الآن"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-8 bg-zinc-50/50 flex flex-col gap-4">
          <Button variant="ghost" asChild className="font-black text-zinc-500 hover:text-primary transition-colors text-lg">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowRight size={20} /> العودة لتسجيل الدخول
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
