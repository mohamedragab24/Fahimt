"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { 
  Zap, 
  BadgeCent, 
  Clock, 
  Send, 
  ChevronRight, 
  Loader2,
  FileText,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function MakeOfferPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ amount: "", duration: "1", details: "" });

  const requestRef = useMemoFirebase(() => (firestore && requestId) ? doc(firestore, "istifhams", requestId as string) : null, [firestore, requestId]);
  const { data: request, isLoading } = useDoc(requestRef);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !request) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, "istifhams", requestId as string, "offers"), {
        mufhemId: user.uid,
        mufhemName: user.displayName || "مفهم",
        amount: Number(formData.amount),
        duration: formData.duration,
        details: formData.details,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      toast({ title: "تم إرسال عرضك بنجاح!" });
      router.push(`/requests/${requestId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-black">جاري التحميل...</div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10" dir="rtl">
      <h1 className="text-3xl font-black text-right">تقديم عرض تفهيم</h1>
      <Card className="rounded-[2.5rem] border-2 shadow-2xl bg-white p-8 md:p-10 space-y-8 text-right">
        <form onSubmit={handleSendOffer} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="font-black text-lg">سعرك المقترح (ج.م)</Label>
              <Input type="number" className="h-16 rounded-2xl border-2 font-black text-2xl text-center" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
            </div>
            <div className="space-y-3">
              <Label className="font-black text-lg">موعد التوافر (بالأيام)</Label>
              <Input type="number" className="h-16 rounded-2xl border-2 font-bold text-xl text-center" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="font-black text-lg">كيف ستشرح هذا الموضوع؟</Label>
            <Textarea className="h-48 rounded-[2rem] border-2 p-6 text-lg font-medium" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} required />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full h-20 rounded-[2rem] text-2xl font-black bg-primary">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "إرسال العرض الآن"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
