
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
  
  // حالات الفلترة الهرمية
  const [selectedMain, setSelectedMain] = useState("all");
  const [selectedSub, setSelectedSub] = useState("all");
  const [selectedOpt, setSelectedOpt] = useState("all");

  // جلب كافة التصنيفات لبناء الهرم
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("name", "asc"));
  }, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

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

  // تصنيفات المستويات
  const mainCategories = useMemo(() => allCategories?.filter(c => c.type === 'main' || !c.type) || [], [allCategories]);
  const subCategories = useMemo(() => {
    if (selectedMain === "all") return [];
    const parent = mainCategories.find(c => c.name === selectedMain);
    return allCategories?.filter(c => c.type === 'sub' && c.parentId === parent?.id) || [];
  }, [allCategories, selectedMain, mainCategories]);
  const optCategories = useMemo(() => {
    if (selectedSub === "all") return [];
    const parent = subCategories.find(c => c.name === selectedSub);
    return allCategories?.filter(c => c.type === 'option' && c.parentId === parent?.id) || [];
  }, [allCategories, selectedSub, subCategories]);

  // منطق التصفية المطور (الهرمي)
  const filteredRequests = useMemo(() => {
    if (!rawRequests) return [];
    
    return rawRequests
      .filter(r => {
        const matchesSearch = !searchTerm.trim() || (
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.mustafhemName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesMain = selectedMain === "all" || r.category === selectedMain;
        const matchesSub = selectedSub === "all" || r.categorySub === selectedSub;
        // ملاحظة: r.categoryOpt غير موجود حالياً في الداتا، لكننا نطبق المنطق للمستقبل
        const matchesOpt = selectedOpt === "all" || r.categoryOpt === selectedOpt;
        
        return matchesSearch && matchesMain && matchesSub && matchesOpt;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawRequests, searchTerm, selectedMain, selectedSub, selectedOpt]);

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
            placeholder="ابحث باسم المفهم..." 
            className="h-14 pr-12 rounded-2xl border-none shadow-md bg-white focus:ring-2 focus:ring-primary/20 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Hierarchical Category Filter */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Row 1: Main Category */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest px-2">
            <Filter size={12} /> الأقسام الرئيسية
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill label="الكل" active={selectedMain === "all"} onClick={() => { setSelectedMain("all"); setSelectedSub("all"); setSelectedOpt("all"); }} />
            {mainCategories.map((cat) => (
              <FilterPill key={cat.id} label={cat.name} active={selectedMain === cat.name} onClick={() => { setSelectedMain(cat.name); setSelectedSub("all"); setSelectedOpt("all"); }} />
            ))}
          </div>
        </div>

        {/* Row 2: Sub Category */}
        {subCategories.length > 0 && (
          <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest px-2">
              <ChevronRight size={12} className="rotate-180" /> التخصصات الفرعية
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterPill label="الكل" active={selectedSub === "all"} onClick={() => { setSelectedSub("all"); setSelectedOpt("all"); }} />
              {subCategories.map((cat) => (
                <FilterPill key={cat.id} label={cat.name} active={selectedSub === cat.name} onClick={() => { setSelectedSub(cat.name); setSelectedOpt("all"); }} />
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Options / Skills */}
        {optCategories.length > 0 && (
          <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest px-2">
              <Zap size={12} /> مهارات وخيارات دقيقة
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterPill label="الكل" active={selectedOpt === "all"} onClick={() => setSelectedOpt("all")} />
              {optCategories.map((cat) => (
                <FilterPill key={cat.id} label={cat.name} active={selectedOpt === cat.name} onClick={() => setSelectedOpt(cat.name)} />
              ))}
            </div>
          </div>
        )}
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
            <Button variant="ghost" onClick={() => { setSelectedMain("all"); setSelectedSub("all"); setSelectedOpt("all"); }} className="font-bold text-primary">عرض كافة الاستفهامات</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 rounded-xl text-xs font-black transition-all border-2",
        active 
          ? "bg-primary border-primary text-white shadow-md scale-105" 
          : "bg-white border-zinc-100 text-zinc-500 hover:border-primary/30"
      )}
    >
      {active && <Check size={12} className="inline-block ml-1.5" />}
      {label}
    </button>
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
