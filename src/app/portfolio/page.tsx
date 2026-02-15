
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldCheck, Eye, ImageIcon, User, Clock, Layout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function GlobalPortfolioPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // جلب كافة الأعمال من كل المفهمين مرتبة حسب الأحدث
  const portfolioQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "portfolio"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: portfolioItems, isLoading: isPortfolioLoading } = useCollection(portfolioQuery);

  // جلب كافة المستخدمين لربط الأعمال بأصحابها
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore]);

  const { data: allUsers } = useCollection(usersQuery);

  const filteredItems = portfolioItems?.filter(item => {
    const teacher = allUsers?.find(u => u.id === item.mufhemId);
    return (
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 md:p-10 space-y-12 bg-[#f9f9f9] min-h-screen" dir="rtl">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
        <div className="space-y-2 text-right w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 flex items-center gap-3">
            <Layout className="text-primary" /> أعمال المفهمين
          </h1>
          <p className="text-muted-foreground font-bold">تصفح أحدث النماذج التعليمية والمشاريع المنفذة.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث عن عمل أو مدرس..." 
            className="h-14 pr-12 rounded-2xl border-none shadow-sm bg-white focus:ring-2 focus:ring-primary/20 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {isPortfolioLoading ? (
          <div className="col-span-full py-20 text-center animate-pulse font-black text-2xl opacity-20">جاري تحميل المعرض...</div>
        ) : filteredItems?.map((item) => {
          const teacher = allUsers?.find(u => u.id === item.mufhemId);
          return (
            <div key={item.id} className="space-y-4 group cursor-pointer" onClick={() => setSelectedItem({ ...item, teacher })}>
              <div className="relative aspect-[16/10] rounded-[1.5rem] overflow-hidden shadow-md bg-zinc-200">
                <img 
                  src={item.mediaUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Featured Badge */}
                <Badge className="absolute top-4 right-4 bg-[#FFC107] text-zinc-900 font-black hover:bg-[#FFC107] border-none px-4 py-1.5 rounded-lg text-xs">
                  مميز
                </Badge>

                {/* Teacher Avatar Overlay */}
                <div className="absolute bottom-4 right-4">
                  <Avatar className="h-12 w-12 border-4 border-white shadow-xl">
                    <AvatarImage src={teacher?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">
                      {teacher?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="px-2 space-y-1 text-right">
                <h3 className="font-black text-lg text-zinc-800 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 font-bold">
                  {teacher?.specialization || "تصميم وأعمال تعليمية"}
                </p>
              </div>
            </div>
          );
        })}
        
        {(!filteredItems || filteredItems.length === 0) && !isPortfolioLoading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-zinc-200">
            <p className="text-2xl font-black text-zinc-300">لا توجد أعمال مطابقة للبحث حالياً.</p>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-0 relative bg-zinc-900 flex items-center justify-center min-h-[400px]">
              <img 
                src={selectedItem?.mediaUrl} 
                className="max-w-full h-auto max-h-[600px] object-contain"
                alt="Portfolio Detail"
              />
            </div>
            <div className="p-10 space-y-8 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
                <h2 className="text-3xl font-black text-zinc-900">{selectedItem?.title}</h2>
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('ar-EG') : "-"}
                </span>
              </div>

              <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-3xl border-2 border-dashed border-primary/10">
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedItem?.teacher?.profilePictureUrl} />
                  <AvatarFallback className="text-2xl font-black">{selectedItem?.teacher?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-right flex-1">
                  <h4 className="text-2xl font-black flex items-center gap-2">
                    {selectedItem?.teacher?.fullName}
                    {selectedItem?.teacher?.isVerified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
                  </h4>
                  <p className="text-primary font-bold text-lg mt-1">{selectedItem?.teacher?.specialization || "خبير تعليمي"}</p>
                </div>
                <Button 
                  onClick={() => window.location.href = `/teachers?id=${selectedItem?.teacher?.id}`}
                  variant="outline" 
                  className="rounded-2xl h-14 px-8 border-2 font-black shadow-lg"
                >
                  زيارة الملف
                </Button>
              </div>

              <div className="space-y-4">
                <h5 className="text-xl font-black text-zinc-800 flex items-center gap-2">
                  <User size={20} className="text-primary" /> وصف العمل
                </h5>
                <p className="text-zinc-600 text-lg leading-relaxed font-medium bg-zinc-50 p-6 rounded-2xl italic">
                  "{selectedItem?.description || "هذا العمل يمثل مهارة الخبير في تبسيط المعلومات وتقديمها بأسلوب تعليمي مميز."}"
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
