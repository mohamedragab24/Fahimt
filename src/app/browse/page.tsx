
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Clock, 
  User, 
  BadgeCent, 
  ArrowRight, 
  ClipboardList, 
  Zap, 
  Filter, 
  Check, 
  Calendar, 
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  // جلب المستخدمين لعرض الصور والمسميات
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);
  const { data: allUsers } = useCollection(usersQuery);

  // جلب الاستفهامات النشطة
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "istifhams"), 
      where("status", "in", ["active", "accepted", "paid", "completed", "canceled"]),
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
        const matchesOpt = selectedOpt === "all" || r.categoryOpt === selectedOpt;
        
        return matchesSearch && matchesMain && matchesSub && matchesOpt;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawRequests, searchTerm, selectedMain, selectedSub, selectedOpt]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px]">مفتوح</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px]">قيد التفهيم</Badge>;
      case 'paid':
        return <Badge className="bg-purple-100 text-purple-600 border-none font-black text-[10px]">مدفوع</Badge>;
      case 'completed':
        return <Badge className="bg-zinc-100 text-zinc-600 border-none font-black text-[10px]">منتهي</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-600 border-none font-black text-[10px]">ملغي</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-[#f8f9fa] min-h-screen pb-24" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-right w-full md:w-auto border-r-8 border-primary pr-6">
          <h1 className="text-3xl md:text-4xl font-black font-headline text-zinc-900">الاستفهامات المطروحة</h1>
          <p className="text-muted-foreground font-bold">اكتشف أحدث التحديات التعليمية وشارك خبرتك الآن.</p>
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

      {/* Hierarchical Category Filter (Top) */}
      <div className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-sm border">
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
      </div>

      {/* Requests Feed (Redesigned Cards) */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-black text-2xl opacity-20">جاري تحميل الاستفهامات...</div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const requester = allUsers?.find(u => u.id === req.mustafhemId);
            return (
              <Card 
                key={req.id} 
                className="rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 transition-all shadow-md overflow-hidden bg-white group cursor-pointer" 
                onClick={() => router.push(`/requests/${req.id}`)}
              >
                <CardContent className="p-6 md:p-10 space-y-8">
                  {/* Top Metadata Row (Red/Blue instructions) */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-black text-zinc-400 border-b border-zinc-50 pb-6">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 shadow-sm">
                      <BadgeCent size={14} /> <span>{req.amount} ج.م</span>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border">
                      <Calendar size={14} className="text-primary" /> 
                      <span dir="ltr">{new Date(req.meetingTime).toLocaleString('ar-EG', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border">
                      <Layers size={14} className="text-primary" /> <span>{req.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList size={14} className="text-zinc-300" /> <span>0 عروض</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-zinc-300" /> <span>منذ {getTimeAgo(req.createdAt)}</span>
                    </div>
                    <div className="mr-auto">
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Middle Content Section */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                    <div className="space-y-4 text-right flex-1 order-2 md:order-1">
                      <h3 className="text-2xl md:text-4xl font-black text-zinc-900 group-hover:text-primary transition-colors leading-tight">
                        {req.title}
                      </h3>
                      <p className="text-zinc-500 font-medium leading-relaxed text-lg line-clamp-2">
                        {req.description}
                      </p>
                    </div>

                    {/* Requester Info (Right Green instruction) */}
                    <div className="flex items-center gap-4 shrink-0 order-1 md:order-2 self-end md:self-center bg-zinc-50/50 p-4 rounded-[2rem] border border-zinc-100 md:min-w-[220px] justify-end">
                      <div className="text-right">
                        <p className="font-black text-zinc-900 text-lg leading-none">{req.mustafhemName}</p>
                        <p className="text-[10px] text-primary font-bold mt-1.5 uppercase tracking-tighter">
                          {requester?.specialization || "مستفهم طموح"}
                        </p>
                      </div>
                      <Avatar className="h-16 w-16 border-4 border-white shadow-xl">
                        <AvatarImage src={requester?.profilePictureUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{req.mustafhemName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-primary font-black flex items-center gap-2">عرض كامل التفاصيل <ArrowRight className="rotate-180" size={16} /></span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-zinc-100 shadow-inner flex flex-col items-center gap-6">
            <div className="bg-zinc-50 p-8 rounded-full shadow-inner"><ClipboardList size={64} className="text-zinc-200" /></div>
            <p className="text-2xl font-black text-zinc-300">لا توجد استفهامات منشورة مطابقة حالياً.</p>
            <Button variant="ghost" onClick={() => { setSelectedMain("all"); setSelectedSub("all"); setSelectedOpt("all"); }} className="font-bold text-primary">إعادة تعيين الفلاتر</Button>
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
        "px-6 py-3 rounded-2xl text-xs font-black transition-all border-2",
        active 
          ? "bg-primary border-primary text-white shadow-lg scale-105" 
          : "bg-white border-zinc-100 text-zinc-500 hover:border-primary/30"
      )}
    >
      {active && <Check size={14} className="inline-block ml-2" />}
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
