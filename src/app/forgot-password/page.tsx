
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
import { Mail, Loader2, ShieldCheck, CheckCircle2, ChevronRight, Lock, Sparkles, MessageSquare, Smartphone } from "lucide-react";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { generateAndSendOTP } from "@/ai/flows/otp-flow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRIES = [
  { code: "+20", name: "مصر", flag: "🇪🇬" },
  { code: "+966", name: "السعودية", flag: "🇸🇦" },
  { code: "+971", name: "الإمارات", flag: "🇦🇪" },
  { code: "+965", name: "الكويت", flag: "🇰🇼" },
  { code: "+974", name: "قطر", flag: "🇶🇦" },
  { code: "+962", name: "الأردن", flag: "🇯🇴" },
  { code: "+968", name: "عمان", flag: "🇴🇲" },
  { code: "+973", name: "البحرين", flag: "🇧🇭" },
  { code: "+212", name: "المغرب", flag: "🇲🇦" },
  { code: "+213", name: "الجزائر", flag: "🇩🇿" },
  { code: "+216", name: "تونس", flag: "🇹🇳" },
  { code: "+218", name: "ليبيا", flag: "🇱🇾" },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [method, setOtpMethod] = useState<'email' | 'whatsapp'>('whatsapp');
  const [step, setStep] = useState<'input' | 'verify' | 'success'>('input');
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const handleSendOTP = async () => {
    const fullPhone = phone.startsWith("+") ? phone : `${countryCode}${phone.startsWith("0") ? phone.substring(1) : phone}`;
    const recipient = method === 'whatsapp' ? fullPhone : email;
    
    if (!recipient) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await generateAndSendOTP({ recipient, method });
      if (result.success) {
        setGeneratedCode(result.code);
        setStep('verify');
        toast({ title: "تم إرسال الرمز بنجاح" });
      } else {
        toast({ variant: "destructive", title: "فشل الإرسال", description: result.message });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الخدمة" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (otpCode !== generatedCode) {
      toast({ variant: "destructive", title: "رمز خاطئ" });
      return;
    }

    setIsProcessing(true);
    try {
      // إرسال رابط إعادة التعيين الرسمي لبريد المستخدم بعد التحقق من الهوية
      await sendPasswordResetEmail(auth, email);
      setStep('success');
      toast({ title: "تم التحقق!", description: "أرسلنا رابط تعيين كلمة المرور لبريدك." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "تأكد من صحة البريد المرتبط بالحساب." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#F8FAFC]" dir="rtl">
      <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 -z-10"></div>
      
      <Card className="w-full max-w-xl shadow-[0_40px_100px_rgba(0,0,0,0.08)] border-4 border-white rounded-[4rem] bg-white overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="text-center pt-16 pb-8 space-y-10">
          <div className="relative mx-auto w-fit group">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-40 md:h-52 mx-auto object-contain transition-transform duration-500 group-hover:scale-110" alt="Logo" />
            ) : (
              <div className="bg-primary w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto text-white shadow-2xl">
                <Lock size={64} strokeWidth={2.5} />
              </div>
            )}
          </div>

          <div className="space-y-3 px-6">
            <CardTitle className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight flex items-center justify-center gap-3">
              {step === 'verify' ? "تأكيد الهوية" : "استعادة الدخول"}
            </CardTitle>
            <CardDescription className="text-xl font-bold text-zinc-500 leading-relaxed max-w-sm mx-auto">
              {step === 'verify' ? "أدخل الرمز الذي وصلك للمتابعة" : "اختر الوسيلة الأنسب لاستلام رمز الاستعادة"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-10 md:px-16 pb-12">
          {step === 'input' && (
            <div className="space-y-8">
              <div className="flex gap-2 p-2 bg-zinc-50 rounded-2xl border mb-4">
                <Button onClick={() => setOtpMethod('whatsapp')} variant={method === 'whatsapp' ? 'default' : 'ghost'} className="flex-1 h-12 rounded-xl font-black">
                  <MessageSquare size={18} className="ml-2" /> واتساب
                </Button>
                <Button onClick={() => setOtpMethod('email')} variant={method === 'email' ? 'default' : 'ghost'} className="flex-1 h-12 rounded-xl font-black">
                  <Mail size={18} className="ml-2" /> بريد
                </Button>
              </div>

              <div className="space-y-4">
                <Label className="font-black text-lg text-zinc-800">
                  {method === 'whatsapp' ? 'رقم الهاتف المسجل' : 'البريد الإلكتروني'}
                </Label>
                {method === 'whatsapp' ? (
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[100px] h-16 rounded-2xl border-2 font-black">
                        <SelectValue placeholder="الرمز" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="font-bold">
                            <span className="ml-2">{c.flag}</span> {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="01xxxxxxxxx" value={phone} onChange={(e)=>setPhone(e.target.value)} className="h-16 flex-1 rounded-2xl border-2 font-black text-2xl shadow-sm" />
                  </div>
                ) : (
                  <Input type="email" placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} className="h-16 rounded-2xl border-2 font-black text-xl shadow-sm" />
                )}
                {method === 'whatsapp' && (
                  <div className="space-y-2">
                    <Label className="font-black text-sm opacity-50">البريد (لإرسال الرابط النهائي)</Label>
                    <Input type="email" placeholder="بريدك الإلكتروني المرتبط بالحساب" value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                )}
              </div>

              <Button onClick={handleSendOTP} disabled={isProcessing} className="w-full h-20 rounded-[2rem] font-black text-2xl bg-primary shadow-xl">
                {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "إرسال رمز الاستعادة"}
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="font-black text-xl text-center block">رمز التحقق</Label>
                <Input 
                  maxLength={6} 
                  className="h-20 text-4xl font-black text-center tracking-[0.5em] rounded-3xl border-4 border-primary/20"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>
              <Button onClick={handleVerifyAndReset} disabled={isProcessing} className="w-full h-20 rounded-[2rem] font-black text-2xl bg-accent shadow-xl">
                {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : "تأكيد الرمز"}
              </Button>
              <Button variant="ghost" onClick={() => setStep('input')} className="w-full font-bold">الرجوع</Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-10 py-6">
              <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 size={80} className="animate-bounce" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black">تم إرسال الرابط!</h3>
                <p className="text-xl font-bold text-zinc-500 leading-relaxed px-4">
                  تحقق من بريدك الآن لتعيين كلمة المرور الجديدة.
                </p>
              </div>
              <Button asChild className="w-full h-20 rounded-[2rem] text-2xl font-black bg-zinc-900">
                <Link href="/login">العودة لتسجيل الدخول</Link>
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t border-zinc-50 py-12 bg-zinc-50/30">
          <Button variant="ghost" asChild className="font-black text-zinc-400 hover:text-primary text-xl gap-3 h-14">
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
