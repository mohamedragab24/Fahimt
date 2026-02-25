
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, User, BadgeCent, ArrowRight, ClipboardList, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BrowseRequestsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // تم إزالة orderBy من الاستعلام لتجنب أخطاء الفهارس
    return query(
      collection(firestore, "istifhams"), 
      where("status", "==", "active"),
      limit(100)
    );
  }, [firestore]);

  const { data: rawRequests, isLoading } = useCollection(requestsQuery);

  const filteredRequests = useMemo(() => {
    if (!rawRequests) return [];
    return rawRequests
      .filter(r => 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawRequests, searchTerm]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 bg-white min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-r-8 border-primary pr-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-headline text-zinc-900">تصفح الاستفهامات المفتوحة</h1>
          <p className="text-muted-foreground text-lg">اطلع على أحدث المواضيع التي يبحث الطلاب عن "فهمها" الآن.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالعنوان أو التخصص..." 
            className="h-14 pr-12 rounded-2xl border-2 shadow-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-black text-2xl">جاري تحميل الاستفهامات...</div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <Card key={req.id} className="rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 transition-all shadow-md overflow-hidden bg-white group cursor-pointer" onClick={() => router.push(`/requests/${req.id}`)}>
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4 text-right flex-1">
                  <div className="flex items-center gap-3 justify-end md:justify-start">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold px-4 py-1">{req.category}</Badge>
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock size={12}/> منذ {getTimeAgo(req.createdAt)}</span>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 group-hover:text-primary transition-colors">{req.title}</h3>
                  <p className="text-zinc-600 font-medium leading-relaxed line-clamp-2">{req.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm font-bold text-zinc-400">
                    <span className="flex items-center gap-2"><User size={16}/> {req.mustafhemName}</span>
                    <span className="flex items-center gap-2"><BadgeCent size={16}/> {req.amount} ج.م</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button className="h-16 px-10 rounded-2xl font-black text-lg bg-zinc-900 hover:bg-primary transition-all group-hover:scale-105 shadow-xl">
                    عرض التفاصيل <ArrowRight className="mr-2 rotate-180" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-32 text-center bg-zinc-50 rounded-[4rem] border-4 border-dashed border-zinc-100 flex flex-col items-center gap-6">
            <div className="bg-white p-8 rounded-full shadow-inner"><ClipboardList size={64} className="text-zinc-200" /></div>
            <p className="text-2xl font-black text-zinc-300">لا توجد استفهامات مفتوحة حالياً تطابق بحثك.</p>
          </div>
        )}
      </div>

      <Card className="rounded-[3rem] bg-primary text-white p-10 md:p-16 overflow-hidden relative border-none">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <Zap size={150} />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <h3 className="text-3xl md:text-5xl font-black font-headline">هل تمتلك خبرة الشرح المبسط؟</h3>
          <p className="text-xl font-bold opacity-90 max-w-3xl mx-auto">سجل الآن كـ "مُفهم" وابدأ في مساعدة الطلاب وتحقيق الأرباح من خلال شروحاتك المباشرة.</p>
          <Button onClick={() => router.push('/login')} className="h-20 px-16 rounded-3xl bg-white text-primary hover:bg-zinc-100 text-2xl font-black shadow-2xl">
            ابدأ رحلة التفهيم الآن
          </Button>
        </div>
      </Card>
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  if (!dateStr) return "لحظات";
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 60) return `${minutes} دقيقة`;
  if (hours < 24) return `${hours} ساعة`;
  return `${days} يوم`;
}
