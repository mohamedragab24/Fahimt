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
import { Mail, Loader2, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react";
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
        toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من بريدك الإلكتروني." });
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
      toast({ variant: "destructive", title: "رمز خاطئ", description: "الرمز غير مطابق." });
      return;
    }

    setIsVerified(true);
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "تم التحقق بنجاح!", 
        description: "أرسلنا لك الآن رابطاً رسمياً لتعيين كلمة المرور الجديدة على بريدك." 
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال رابط الاستعادة النهائي." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50/50" dir="rtl">
      <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none rounded-[3rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pt-12 pb-8 space-y-6">
          <div className="mx-auto scale-110">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-32 md:h-40 mx-auto object-contain" alt="Logo" />
            ) : (
              <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner">
                <ShieldCheck size={48} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black text-zinc-900">استعادة الوصول</CardTitle>
            <CardDescription className="text-lg font-bold text-muted-foreground px-6">
              سنتحقق من هويتك عبر رمز OTP أولاً لضمان أمان حسابك.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 pb-8">
          {!isVerified ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="font-black text-zinc-700 mr-2 flex items-center gap-2">
                  <Mail size={16} className="text-primary" /> البريد الإلكتروني للحساب
                </Label>
                <div className="flex gap-2">
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={otpSent}
                    className="h-16 rounded-2xl border-2 focus:border-primary text-lg font-bold bg-zinc-50/50"
                  />
                  {!otpSent && (
                    <Button onClick={handleSendOTP} disabled={isProcessing} className="h-16 px-8 rounded-2xl font-black bg-primary">
                      {isProcessing ? <Loader2 className="animate-spin" /> : "إرسال"}
                    </Button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-6 animate-in zoom-in">
                  <div className="text-center space-y-2">
                    <Label className="font-black text-xl text-primary flex items-center justify-center gap-2">
                      <KeyRound size={24} /> رمز التحقق
                    </Label>
                    <p className="text-sm text-muted-foreground font-bold">أدخل الرمز المكون من 6 أرقام</p>
                  </div>
                  <Input 
                    placeholder="0 0 0 0 0 0" 
                    maxLength={6}
                    value={otpCodeInput} 
                    onChange={(e)=>setOtpCodeInput(e.target.value)}
                    className="h-20 text-4xl font-black text-center tracking-[0.5em] rounded-3xl border-2 bg-white" 
                  />
                  <Button onClick={handleVerifyAndReset} disabled={isProcessing} className="w-full h-16 rounded-2xl font-black text-xl bg-primary shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin ml-2" /> : "تأكيد الرمز والاستعادة"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6 py-8 animate-in slide-in-from-bottom-4">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-black text-zinc-800">تم التحقق بنجاح!</h3>
              <p className="text-muted-foreground font-bold leading-relaxed">
                لقد أرسلنا الآن رابطاً خاصاً لتعيين كلمة المرور الجديدة على بريدك الإلكتروني. يرجى الضغط عليه لإكمال العملية.
              </p>
              <Button asChild className="w-full h-14 rounded-xl font-bold">
                <Link href="/login">العودة لتسجيل الدخول</Link>
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t py-8 bg-zinc-50/50">
          <Button variant="ghost" asChild className="font-black text-zinc-500 hover:text-primary transition-colors text-lg">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowRight size={20} className="rotate-180" /> العودة لتسجيل الدخول
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
