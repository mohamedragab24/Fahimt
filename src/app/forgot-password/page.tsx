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
import { Mail, Loader2, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, ChevronRight } from "lucide-react";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [serverOtpCode, setServerOtpCode] = useState("");
  
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await generateAndSendOTP({ recipient: email, method: 'email' });
      if (result.success) {
        setServerOtpCode(result.code);
        setOtpSent(true);
        toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من بريدك الإلكتروني للحصول على رمز الاستعادة." });
      } else {
        toast({ variant: "destructive", title: "خطأ", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في النظام", description: "فشل إرسال الرمز، يرجى المحاولة لاحقاً." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (otpCodeInput !== serverOtpCode || serverOtpCode === "") {
      toast({ variant: "destructive", title: "رمز خاطئ", description: "الرمز غير مطابق للرمز المرسل." });
      return;
    }

    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsVerified(true);
      toast({ 
        title: "تم التحقق بنجاح!", 
        description: "أرسلنا لك الآن رابطاً رسمياً لتعيين كلمة المرور الجديدة على بريدك." 
      });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال رابط الاستعادة النهائي، ربما البريد غير مسجل." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_30px_80px_rgba(0,0,0,0.12)] border-none rounded-[3.5rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pt-14 pb-8 space-y-8">
          <div className="mx-auto scale-110 transition-transform hover:scale-125 duration-500">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-36 md:h-48 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="bg-primary/10 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner">
                <ShieldCheck size={56} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black text-zinc-900">استعادة الوصول</CardTitle>
            <CardDescription className="text-xl font-bold text-muted-foreground px-10 leading-relaxed">
              سنتحقق من ملكيتك للبريد الإلكتروني أولاً لضمان أمان حسابك الخاص.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-12 pb-10">
          {!isVerified ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <Label className="font-black text-lg text-zinc-700 mr-2 flex items-center gap-3">
                  <Mail size={22} className="text-primary" /> البريد الإلكتروني للحساب
                </Label>
                <div className="flex gap-3">
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={otpSent}
                    className="h-16 rounded-2xl border-2 focus:border-primary text-xl font-black bg-zinc-50/50 shadow-inner"
                  />
                  {!otpSent && (
                    <Button onClick={handleSendOTP} disabled={isProcessing} className="h-16 px-10 rounded-2xl font-black text-lg bg-primary shadow-xl">
                      {isProcessing ? <Loader2 className="animate-spin" /> : "إرسال"}
                    </Button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="p-10 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-primary/20 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="text-center space-y-3">
                    <Label className="font-black text-2xl text-primary flex items-center justify-center gap-3">
                      <KeyRound size={28} /> رمز التحقق (OTP)
                    </Label>
                    <p className="text-md text-muted-foreground font-bold">أدخل الرمز المكون من 6 أرقام</p>
                  </div>
                  <Input 
                    placeholder="0 0 0 0 0 0" 
                    maxLength={6}
                    value={otpCodeInput} 
                    onChange={(e)=>setOtpCodeInput(e.target.value)}
                    className="h-24 text-5xl font-black text-center tracking-[0.4em] rounded-[2rem] border-2 border-primary/30 bg-white shadow-inner" 
                  />
                  <Button onClick={handleVerifyAndReset} disabled={isProcessing} className="w-full h-16 rounded-2xl font-black text-2xl bg-primary shadow-2xl hover:scale-[1.02] transition-all">
                    {isProcessing ? <Loader2 className="animate-spin ml-2" /> : "تأكيد الرمز والاستعادة"}
                  </Button>
                  <Button variant="link" onClick={() => { setOtpSent(false); setServerOtpCode(""); }} className="w-full text-zinc-400 font-bold hover:text-primary">تغيير البريد؟</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-8 py-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-green-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
                <CheckCircle2 size={64} className="animate-bounce" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-zinc-800">تفقد بريدك الآن</h3>
                <p className="text-lg text-muted-foreground font-bold leading-relaxed px-6">
                  لقد أرسلنا رابطاً رسمياً لتعيين كلمة المرور الجديدة. يرجى الضغط عليه لإتمام عملية الاستعادة والعودة لأسرة فهمني.
                </p>
              </div>
              <Button asChild className="w-full h-16 rounded-2xl text-2xl font-black shadow-2xl bg-zinc-900 hover:bg-zinc-800">
                <Link href="/login">العودة لتسجيل الدخول</Link>
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t py-10 bg-zinc-50/50">
          <Button variant="ghost" asChild className="font-black text-zinc-500 hover:text-primary transition-all text-xl gap-3">
            <Link href="/login" className="flex items-center gap-3">
              <ChevronRight size={24} className="rotate-180" /> العودة لتسجيل الدخول
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
