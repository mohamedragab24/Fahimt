
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

export default function BrowseRequestsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedMain, setSelectedMain] = useState("all");
  const [selectedSub, setSelectedSub] = useState("all");
  const [selectedOpt, setSelectedOpt] = useState("all");

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("name", "asc"));
  }, [firestore]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);
  const { data: allUsers } = useCollection(usersQuery);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), where("status", "==", "active"), limit(100));
  }, [firestore]);

  const { data: rawRequests, isLoading } = useCollection(requestsQuery);

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

  const filteredRequests = useMemo(() => {
    if (!rawRequests) return [];
    return rawRequests.filter(r => {
      const matchesSearch = !searchTerm.trim() || r.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMain = selectedMain === "all" || r.category === selectedMain;
      const matchesSub = selectedSub === "all" || r.categorySub === selectedSub;
      const matchesOpt = selectedOpt === "all" || r.categoryOpt === selectedOpt;
      return matchesSearch && matchesMain && matchesSub && matchesOpt;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawRequests, searchTerm, selectedMain, selectedSub, selectedOpt]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">الاستفهامات المطروحة</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث باسم المفهم..." 
            className="h-14 pr-12 rounded-2xl border-none shadow-md bg-white text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] shadow-sm border">
        <div className="flex flex-wrap gap-2">
          <FilterPill label="الكل" active={selectedMain === "all"} onClick={() => { setSelectedMain("all"); setSelectedSub("all"); setSelectedOpt("all"); }} />
          {mainCategories.map((cat) => (
            <FilterPill key={cat.id} label={cat.name} active={selectedMain === cat.name} onClick={() => { setSelectedMain(cat.name); setSelectedSub("all"); setSelectedOpt("all"); }} />
          ))}
          <FilterPill label="أخرى" active={selectedMain === "أخرى"} onClick={() => { setSelectedMain("أخرى"); setSelectedSub("all"); setSelectedOpt("all"); }} />
        </div>
        {selectedMain !== "all" && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed">
            <FilterPill label="الكل" active={selectedSub === "all"} onClick={() => { setSelectedSub("all"); setSelectedOpt("all"); }} />
            {subCategories.map((cat) => (
              <FilterPill key={cat.id} label={cat.name} active={selectedSub === cat.name} onClick={() => { setSelectedSub(cat.name); setSelectedOpt("all"); }} />
            ))}
            <FilterPill label="أخرى" active={selectedSub === "أخرى"} onClick={() => { setSelectedSub("أخرى"); setSelectedOpt("all"); }} />
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {isLoading ? <div className="py-20 text-center font-black">جاري تحميل الاستفهامات...</div> : 
          filteredRequests.map((req) => {
            const requester = allUsers?.find(u => u.id === req.mustafhemId);
            return (
              <Card key={req.id} className="rounded-[2.5rem] border-2 hover:border-primary/20 transition-all shadow-md overflow-hidden bg-white group cursor-pointer" onClick={() => router.push(`/requests/${req.id}`)}>
                <CardContent className="p-0 flex flex-col md:flex-row h-full">
                  <div className="md:w-64 bg-zinc-50 p-6 flex flex-col items-center justify-center text-center border-l shrink-0">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl mb-4">
                      <AvatarImage src={requester?.profilePictureUrl} />
                      <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{req.mustafhemName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-black text-lg">{req.mustafhemName}</p>
                      <p className="text-[10px] text-primary font-bold">{requester?.specialization || "مستفهم"}</p>
                    </div>
                  </div>

                  <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-black text-zinc-400 bg-zinc-50/50 p-3 rounded-2xl border">
                      <span className="text-green-600 flex items-center gap-1"><BadgeCent size={14} /> {req.amount} ج.م</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(req.meetingTime).toLocaleString('ar-EG')}</span>
                      <span className="flex items-center gap-1"><Layers size={14} /> {req.category}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> منذ {getTimeAgo(req.createdAt)}</span>
                      <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px]">مفتوح</Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-zinc-800">{req.title}</h3>
                      <p className="text-zinc-500 font-medium line-clamp-1">{req.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        }
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("px-5 py-2 rounded-xl text-xs font-black transition-all border-2", active ? "bg-primary border-primary text-white" : "bg-white border-zinc-100 text-zinc-500")}>
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
  if (minutes < 60) return `${minutes}د`;
  if (hours < 24) return `${hours}س`;
  return `${days}ي`;
}
