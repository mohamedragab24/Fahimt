
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, User, BadgeCent, ArrowRight, ClipboardList, Zap, Filter, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BrowseRequestsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // جلب الأقسام الرئيسية للتصفية
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), where("type", "==", "main"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: categories } = useCollection(categoriesQuery);

  // جلب الاستفهامات النشطة
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "==", "active"),
      limit(100)
    );
  }, [firestore]);

  const { data: rawRequests, isLoading } = useCollection(requestsQuery);

  // منطق التصفية المشترك (بحث نصي + قسم)
  const filteredRequests = useMemo(() => {
    if (!rawRequests) return [];
    
    return rawRequests
      .filter(r => {
        const matchesSearch = !searchTerm.trim() || (
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawRequests, searchTerm, selectedCategory]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 bg-[#f8f9fa] min-h-screen pb-24" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
        <div className="space-y-2 text-right w-full md:w-auto border-r-8 border-primary pr-6">
          <h1 className="text-3xl md:text-4xl font-black font-headline text-zinc-900">تصفح الاستفهامات المفتوحة</h1>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالعنوان أو محتوى الطلب..." 
            className="h-14 pr-12 rounded-2xl border-none shadow-md bg-white focus:ring-2 focus:ring-primary/20 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-black text-xs uppercase tracking-widest px-2">
            <Filter size={14} /> تصفية حسب الأقسام
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-6 py-3 rounded-2xl text-sm font-black transition-all border-2",
                selectedCategory === "all" 
                  ? "bg-primary border-primary text-white shadow-lg scale-105" 
                  : "bg-white border-zinc-100 text-zinc-500 hover:border-primary/30"
              )}
            >
              الكل
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 flex items-center gap-2",
                  selectedCategory === cat.name 
                    ? "bg-primary border-primary text-white shadow-lg scale-105" 
                    : "bg-white border-zinc-100 text-zinc-500 hover:border-primary/30"
                )}
              >
                {selectedCategory === cat.name && <Check size={14} />}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Feed */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-black text-2xl opacity-20">جاري تحميل الاستفهامات...</div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <Card key={req.id} className="rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 transition-all shadow-md overflow-hidden bg-white group cursor-pointer" onClick={() => router.push(`/requests/${req.id}`)}>
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4 text-right flex-1 w-full">
                  <div className="flex items-center gap-3 justify-end md:justify-start">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-xl">{req.category}</Badge>
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-1"><Clock size={12}/> منذ {getTimeAgo(req.createdAt)}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-zinc-900 group-hover:text-primary transition-colors leading-tight">{req.title}</h3>
                  <p className="text-zinc-600 font-medium leading-relaxed line-clamp-2">{req.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm font-black text-zinc-400">
                    <span className="flex items-center gap-2 bg-zinc-50 px-3 py-1 rounded-lg border"><User size={16} className="text-primary"/> {req.mustafhemName}</span>
                    <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg border border-green-100 text-green-600"><BadgeCent size={16}/> {req.amount} ج.م</span>
                  </div>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                  <Button className="w-full md:w-auto h-16 px-10 rounded-2xl font-black text-lg bg-zinc-900 hover:bg-primary transition-all group-hover:scale-105 shadow-xl">
                    عرض التفاصيل <ArrowRight className="mr-2 rotate-180" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-zinc-100 shadow-inner flex flex-col items-center gap-6">
            <div className="bg-zinc-50 p-8 rounded-full shadow-inner"><ClipboardList size={64} className="text-zinc-200" /></div>
            <p className="text-2xl font-black text-zinc-300">لا توجد استفهامات منشورة في هذا القسم حالياً.</p>
            <Button variant="ghost" onClick={() => setSelectedCategory("all")} className="font-bold text-primary">عرض كافة الاستفهامات</Button>
          </div>
        )}
      </div>

      <Card className="rounded-[3rem] bg-primary text-white p-10 md:p-16 overflow-hidden relative border-none mt-10 shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <Zap size={150} />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <h3 className="text-3xl md:text-5xl font-black font-headline">هل تمتلك خبرة الشرح المبسط؟</h3>
          <p className="text-xl font-bold opacity-90 max-w-3xl mx-auto leading-relaxed">انضم لنخبة المفهمين في الوطن العربي وابدأ في مشاركة خبرتك مع الطلاب وتحقيق عوائد مجزية.</p>
          <Button onClick={() => router.push('/login')} className="h-20 px-16 rounded-[2rem] bg-white text-primary hover:bg-zinc-100 text-2xl font-black shadow-2xl transition-transform hover:scale-105">
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
