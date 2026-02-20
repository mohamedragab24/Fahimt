
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Layout, PlayCircle, Plus, Filter, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function GlobalPortfolioPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: currentUserProfile } = useDoc(userRef);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  // جلب الأقسام الرئيسية للتصفية
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), where("type", "==", "main"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: categories } = useCollection(categoriesQuery);

  // عرض الأعمال المعتمدة فقط
  const portfolioQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "portfolio"), 
      where("status", "==", "approved")
    );
  }, [firestore]);

  const { data: rawPortfolioItems, isLoading: isPortfolioLoading } = useCollection(portfolioQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);

  const { data: allUsers } = useCollection(usersQuery);

  const portfolioItems = rawPortfolioItems 
    ? [...rawPortfolioItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    : [];

  const filteredItems = portfolioItems?.filter(item => {
    const teacher = allUsers?.find(u => u.id === item.mufhemId);
    const matchesSearch = (
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[#f8f9fa] min-h-screen pb-24" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
        <div className="space-y-2 text-right w-full md:w-auto border-r-8 border-primary pr-6">
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 flex items-center gap-3">
            <Layout className="text-primary" /> {settings?.portfolioListTitle || "أعمال المفهمين"}
          </h1>
          <p className="text-muted-foreground font-bold">{settings?.portfolioListSubtitle || "نماذج تعليمية ملهمة من خبراء منصة فهمني."}</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {currentUserProfile?.role === 'mufhem' && (
            <Button 
              onClick={() => router.push('/portfolio/add')} 
              className="h-14 px-8 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
            >
              <Plus className="ml-2" /> أضف عملك الآن
            </Button>
          )}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="ابحث عن عمل، تخصص، أو مفهم..." 
              className="h-14 pr-12 rounded-2xl border-none shadow-md bg-white focus:ring-2 focus:ring-primary/20 text-lg text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {isPortfolioLoading ? (
          <div className="col-span-full py-20 text-center animate-pulse font-black text-2xl opacity-20">جاري تحميل المعرض...</div>
        ) : filteredItems?.map((item) => {
          const teacher = allUsers?.find(u => u.id === item.mufhemId);
          return (
            <div 
              key={item.id} 
              className="group space-y-5 cursor-pointer" 
              onClick={() => router.push(`/portfolio/${item.id}`)}
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-xl bg-zinc-200 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                {item.mediaType === 'video' ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={item.mediaUrl} 
                      className="w-full h-full object-cover" 
                      muted 
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                      <PlayCircle className="text-white h-16 w-16 drop-shadow-2xl opacity-80 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={item.mediaUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Badge className="bg-[#FFC107] text-zinc-900 font-black border-none px-4 py-1.5 rounded-lg text-xs shadow-md">
                    مميز
                  </Badge>
                  {item.category && (
                    <Badge className="bg-primary text-white font-black border-none px-4 py-1.5 rounded-lg text-xs shadow-md">
                      {item.category}
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-4 right-4">
                  <Avatar className="h-16 w-16 border-[6px] border-white shadow-2xl transition-transform group-hover:scale-110">
                    <AvatarImage src={teacher?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                      {teacher?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="px-4 space-y-2 text-right">
                <h3 className="font-black text-xl text-zinc-800 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex flex-col">
                  <p className="text-sm text-zinc-400 font-bold">
                    {teacher?.fullName}
                  </p>
                  <p className="text-xs text-zinc-300 font-bold mt-1">
                    {item.categorySub || item.category || "خبير تعليمي"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {(!filteredItems || filteredItems.length === 0) && !isPortfolioLoading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-zinc-100 shadow-inner">
            <div className="max-w-md mx-auto space-y-4">
              <Layout size={64} className="mx-auto text-zinc-200" />
              <p className="text-2xl font-black text-zinc-300">لا توجد أعمال منشورة في هذا القسم حالياً.</p>
              <Button variant="ghost" onClick={() => setSelectedCategory("all")} className="font-bold text-primary">عرض كافة الأعمال</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
