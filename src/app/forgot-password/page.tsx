
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Mail, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

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
        title: "تم إرسال الرابط!", 
        description: "يرجى التحقق من بريدك الإلكتروني (بما في ذلك الرسائل غير المرغوب فيها) لإعادة تعيين كلمة المرور." 
      });
      // توجيه المستخدم للبريد أو العودة للدخول بعد مهلة
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f8fafc]" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl border-t-8 border-primary rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="text-center pt-10">
          <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
            <Mail size={40} />
          </div>
          <CardTitle className="text-3xl font-black text-primary">استعادة كلمة المرور</CardTitle>
          <CardDescription className="font-bold">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-3">
              <Label className="font-black text-sm mr-2">البريد الإلكتروني</Label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full h-16 text-xl font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02]">
              {isProcessing ? <><Loader2 className="ml-2 animate-spin" /> جاري الإرسال...</> : "إرسال رابط الاستعادة"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-8 bg-muted/5 flex flex-col gap-4">
          <Button variant="ghost" asChild className="font-bold text-zinc-500 hover:text-primary transition-colors">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowRight size={18} /> العودة لتسجيل الدخول
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
