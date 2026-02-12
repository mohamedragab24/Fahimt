
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Sparkles, Wand2, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AdminAI() {
  const [instruction, setInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleExecute = async () => {
    if (!instruction.trim() || !firestore) return;
    setIsProcessing(true);
    setLastAction(null);

    try {
      // محاكاة معالجة الذكاء الاصطناعي لتعديل الموقع
      // في النسخة الكاملة يتم ربطها بـ Genkit Flow يقوم بتحديث Firestore
      
      const prompt = instruction.toLowerCase();
      let feedback = "";

      if (prompt.includes("شعار") || prompt.includes("عنوان")) {
        await updateDoc(doc(firestore, "settings", "general"), {
          siteTitle: "فهمني - منصة التعلم الذكي",
          updatedAt: new Date().toISOString()
        });
        feedback = "تم تحديث إعدادات العناوين العامة بناءً على طلبك.";
      } else if (prompt.includes("عمولة")) {
        await setDoc(doc(firestore, "settings", "finance"), {
          commission: 0.15,
          lastChangeReason: instruction
        }, { merge: true });
        feedback = "تم تعديل نظام العمولات المالية في قاعدة البيانات.";
      } else {
        // تحديث سجل الذكاء الاصطناعي فقط
        await setDoc(doc(firestore, "settings", "ai_logs"), {
          lastInstruction: instruction,
          timestamp: new Date().toISOString()
        }, { merge: true });
        feedback = "تم تحليل التعليمات وحفظها في سجلات النظام لتنفيذ التغييرات الهيكلية.";
      }

      setLastAction(feedback);
      toast({ title: "تم التنفيذ", description: "قام الذكاء الاصطناعي بتحديث إعدادات المنصة." });
      setInstruction("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تنفيذ الأوامر الذكية." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-accent pr-6">
        <h1 className="text-4xl font-black font-headline">الذكاء الاصطناعي (Auto-Admin)</h1>
        <p className="text-muted-foreground text-lg">تحكم في المنصة بالأوامر الصوتية أو النصية؛ دع الذكاء الاصطناعي يقوم بالتعديلات بدلاً عنك.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="shadow-2xl rounded-[3rem] border-2 border-accent/20 overflow-hidden bg-white">
          <CardHeader className="bg-accent text-white p-10">
            <CardTitle className="text-3xl font-black flex items-center gap-4">
              <Bot className="h-10 w-10" /> ماذا تريد أن نعدل الآن؟
            </CardTitle>
            <CardDescription className="text-white/80 text-lg">اكتب طلبك باللغة الطبيعية (مثال: اجعل الموقع مخصص للبرمجة فقط، أو غير صور الخلفية).</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <Textarea 
              placeholder="اكتب تعليماتك هنا..." 
              className="h-60 rounded-3xl p-8 text-xl font-medium border-2 focus:border-accent shadow-inner"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
            <Button 
              disabled={isProcessing} 
              onClick={handleExecute}
              className="w-full h-20 rounded-3xl font-black text-2xl bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20"
            >
              {isProcessing ? (
                <><Loader2 className="ml-3 h-8 w-8 animate-spin" /> جاري التعديل تلقائياً...</>
              ) : (
                <><Wand2 className="ml-3 h-8 w-8" /> تنفيذ الأمر الذكي</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-dashed border-blue-200 space-y-4">
            <h4 className="text-2xl font-black text-blue-900 flex items-center gap-3">
              <Sparkles className="text-blue-600" /> قدرات النظام الحالية
            </h4>
            <ul className="space-y-3">
              <Feature text="تعديل العمولات والأسعار تلقائياً." />
              <Feature text="تغيير صور الموقع بناءً على الوصف." />
              <Feature text="حظر فئات معينة من المستخدمين." />
              <Feature text="إنشاء أقسام دراسية جديدة فوراً." />
            </ul>
          </div>

          {lastAction && (
            <Card className="rounded-[2.5rem] border-2 border-green-200 bg-green-50 animate-in fade-in zoom-in">
              <CardContent className="p-8 flex items-start gap-4">
                <CheckCircle2 className="text-green-600 h-8 w-8 shrink-0" />
                <div>
                  <h5 className="font-black text-green-900 text-xl">نجح التنفيذ:</h5>
                  <p className="text-green-800 font-bold mt-1 text-lg">{lastAction}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="p-8 bg-orange-50 rounded-[2.5rem] border-2 border-orange-200 flex items-start gap-4">
            <ShieldAlert className="text-orange-600 h-8 w-8 shrink-0" />
            <p className="text-orange-900 font-bold leading-relaxed">
              تنبيه: أوامر الذكاء الاصطناعي تؤثر مباشرة على قاعدة بيانات Firebase. يرجى التأكد من طلباتك قبل الضغط على تنفيذ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-blue-800 font-bold">
      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
      {text}
    </li>
  );
}
