
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
import { Mail, Loader2, ShieldCheck, CheckCircle2, ChevronRight, Lock, Sparkles } from "lucide-react";
import { doc } from "firebase/firestore";
import Link from "next/link";

/**
 * صفحة استعادة كلمة المرور بتصميم احترافي فريد
 * تم دمج اللوجو والألوان الأساسية (اللبني والبرتقالي) مع خطوط Black
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSent, setIsEmailSent] = useState(false);
  
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  // جلب إعدادات المنصة للحصول على اللوجو واسم الموقع
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const handleSendResetLink = async () => {
    if (!email || !email.includes("@")) {
      toast({ 
        variant: "destructive", 
        title: "تنبيه هام", 
        description: "يرجى كتابة بريد إلكتروني صحيح لنتمكن من مساعدتك." 
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // إرسال رابط إعادة التعيين الرسمي من فايربيز
      await sendPasswordResetEmail(auth, email);
      setIsEmailSent(true);
      toast({ 
        title: "تم الإرسال بنجاح!", 
        description: "رابط الأمان في طريقه إلى بريدك الإلكتروني الآن." 
      });
    } catch (e: any) {
      console.error(e);
      toast({ 
        variant: "destructive", 
        title: "عذراً، فشل الإرسال", 
        description: "تأكد من كتابة البريد المسجل لدينا بشكل صحيح." 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#F8FAFC] selection:bg-primary selection:text-white" dir="rtl">
      {/* خلفية جمالية متدرجة */}
      <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 -z-10"></div>
      
      <Card className="w-full max-w-xl shadow-[0_40px_100px_rgba(0,0,0,0.08)] border-4 border-white rounded-[4rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="text-center pt-16 pb-8 space-y-10">
          {/* منطقة اللوجو */}
          <div className="relative mx-auto w-fit group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-40 md:h-52 mx-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" alt="Logo" />
            ) : (
              <div className="bg-primary w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto text-white shadow-2xl relative z-10 transition-transform duration-500 group-hover:rotate-12">
                <Lock size={64} strokeWidth={2.5} />
              </div>
            )}
          </div>

          <div className="space-y-3 px-6">
            <CardTitle className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight flex items-center justify-center gap-3">
              <Sparkles className="text-accent animate-pulse" /> استعادة الدخول
            </CardTitle>
            <CardDescription className="text-xl font-bold text-zinc-500 leading-relaxed max-w-sm mx-auto">
              لا تقلق، سنرسل لك رابطاً آمناً لتعيين كلمة مرور جديدة لبريدك المسجل.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 md:px-16 pb-12">
          {!isSent ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <Label className="font-black text-xl text-zinc-800 mr-2 flex items-center gap-3">
                  <Mail size={24} className="text-primary" /> البريد الإلكتروني للحساب
                </Label>
                <div className="relative">
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-20 rounded-[2rem] border-2 border-zinc-100 focus:border-primary focus:ring-0 text-2xl font-black bg-zinc-50/50 shadow-inner px-8 transition-all"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendResetLink} 
                disabled={isProcessing} 
                className="w-full h-20 rounded-[2rem] font-black text-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_20px_50px_rgba(41,182,246,0.3)] transition-all hover:scale-[1.02] active:scale-95"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin h-8 w-8" />
                    <span>جاري التحقق والإرسال...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>إرسال رابط الاستعادة</span>
                    <ChevronRight className="h-8 w-8 rotate-180" />
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-10 py-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="relative mx-auto w-fit">
                <div className="absolute inset-0 bg-green-400/20 blur-3xl rounded-full scale-150"></div>
                <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto text-green-600 relative z-10 shadow-lg">
                  <CheckCircle2 size={80} className="animate-bounce" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-zinc-900">رابط الأمان وصل!</h3>
                <p className="text-xl font-bold text-zinc-500 leading-relaxed px-4">
                  لقد أرسلنا تعليمات استعادة كلمة المرور لبريدك: <br/>
                  <span className="text-primary font-black underline decoration-dashed underline-offset-8 mt-2 block">{email}</span>
                </p>
              </div>
              <Button asChild className="w-full h-20 rounded-[2rem] text-2xl font-black shadow-xl bg-zinc-900 hover:bg-black transition-all">
                <Link href="/login">العودة لتسجيل الدخول</Link>
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t border-zinc-50 py-12 bg-zinc-50/30">
          <Button variant="ghost" asChild className="font-black text-zinc-400 hover:text-primary text-xl gap-3 transition-colors h-14 rounded-2xl">
            <Link href="/login">
              <ChevronRight size={28} className="rotate-180" /> 
              <span>رجوع للخلف</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
