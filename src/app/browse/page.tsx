
"use client";

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
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
  Timer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * صفحة الاستفهامات المطروحة - تم تحديثها لتشمل خيار "أخرى" في الفلترة الهرمية.
 */
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

  // جلب الاستفهامات
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

  // منطق التصفية
  const filteredRequests = useMemo(() => {
    if (!rawRequests) return [];
    
    return rawRequests
      .filter(r => {
        const matchesSearch = !searchTerm.trim() || (
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-[#f8f9fa] min-h-screen pb-24" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-right w-full md:w-auto border-r-8 border-primary pr-6">
          <h1 className="text-3xl md:text-4xl font-black font-headline text-zinc-900">الاستفهامات المطروحة</h1>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث باسم المفهم..." 
            className="h-14 pr-12 rounded-2xl border-none shadow-md bg-white focus:ring-2 focus:ring-primary/20 text-lg text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Hierarchical Filter (Top) */}
      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] shadow-sm border">
        {/* المستوى الأول: الأقسام */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest px-2">
            <Filter size={12} /> الأقسام الرئيسية
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill label="الكل" active={selectedMain === "all"} onClick={() => { setSelectedMain("all"); setSelectedSub("all"); setSelectedOpt("all"); }} />
            {mainCategories.map((cat) => (
              <FilterPill key={cat.id} label={cat.name} active={selectedMain === cat.name} onClick={() => { setSelectedMain(cat.name); setSelectedSub("all"); setSelectedOpt("all"); }} />
            ))}
            <FilterPill label="أخرى" active={selectedMain === "أخرى"} onClick={() => { setSelectedMain("أخرى"); setSelectedSub("all"); setSelectedOpt("all"); }} />
          </div>
        </div>

        {/* المستوى الثاني: التخصصات */}
        {selectedMain !== "all" && (
          <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest px-2">
              <ChevronRight size={12} className="rotate-180" /> التخصصات
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterPill label="الكل" active={selectedSub === "all"} onClick={() => { setSelectedSub("all"); setSelectedOpt("all"); }} />
              {subCategories.map((cat) => (
                <FilterPill key={cat.id} label={cat.name} active={selectedSub === cat.name} onClick={() => { setSelectedSub(cat.name); setSelectedOpt("all"); }} />
              ))}
              <FilterPill label="أخرى" active={selectedSub === "أخرى"} onClick={() => { setSelectedSub("أخرى"); setSelectedOpt("all"); }} />
            </div>
          </div>
        )}

        {/* المستوى الثالث: الخيارات */}
        {selectedSub !== "all" && (
          <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest px-2">
              <Layers size={12} /> مهارات إضافية
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterPill label="الكل" active={selectedOpt === "all"} onClick={() => setSelectedOpt("all")} />
              {optCategories.map((cat) => (
                <FilterPill key={cat.id} label={cat.name} active={selectedOpt === cat.name} onClick={() => setSelectedOpt(cat.name)} />
              ))}
              <FilterPill label="أخرى" active={selectedOpt === "أخرى"} onClick={() => setSelectedOpt("أخرى")} />
            </div>
          </div>
        )}
      </div>

      {/* Requests Feed */}
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
                <CardContent className="p-0 flex flex-col md:flex-row h-full">
                  {/* Right: Requester Data */}
                  <div className="md:w-64 bg-zinc-50/50 p-6 flex flex-col items-center justify-center text-center border-l border-zinc-100 shrink-0">
                    <Avatar className="h-20 w-24 md:h-24 md:w-24 border-4 border-white shadow-xl mb-4">
                      <AvatarImage src={requester?.profilePictureUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">{req.mustafhemName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-black text-zinc-900 text-lg leading-tight">{req.mustafhemName}</p>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                        {requester?.specialization || "مستفهم طموح"}
                      </p>
                    </div>
                  </div>

                  {/* Left: Content & Metadata */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between space-y-6">
                    {/* Top Bar: Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-black text-zinc-400">
                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                        <BadgeCent size={14} /> <span>{req.amount} ج.م</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                        <Calendar size={14} className="text-primary" /> 
                        <span dir="ltr">{new Date(req.meetingTime).toLocaleString('ar-EG', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                        <Layers size={14} className="text-primary" /> <span>{req.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                        <ClipboardList size={14} className="text-primary" /> <span>عروض نشطة</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-zinc-300" /> <span>منذ {getTimeAgo(req.createdAt)}</span>
                      </div>
                      <div className="mr-auto">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Middle: Title & Desc */}
                    <div className="space-y-3 text-right">
                      <h3 className="text-2xl md:text-3xl font-black text-zinc-800 group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {req.title}
                      </h3>
                      <p className="text-zinc-500 font-medium leading-relaxed text-md line-clamp-2">
                        {req.description}
                      </p>
                    </div>

                    <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-primary font-black text-xs flex items-center gap-2">عرض التفاصيل الكاملة <ArrowRight className="rotate-180" size={14} /></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-zinc-100 shadow-inner flex flex-col items-center gap-6">
            <ClipboardList size={64} className="text-zinc-200" />
            <p className="text-2xl font-black text-zinc-300">لا توجد استفهامات مطابقة حالياً.</p>
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
  if (minutes < 60) return `${minutes} د`;
  if (hours < 24) return `${hours} س`;
  return `${days} ي`;
}
