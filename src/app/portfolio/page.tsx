
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldCheck, Clock, Layout, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function GlobalPortfolioPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // عرض الأعمال المعتمدة فقط - تبسيط الاستعلام لتجنب الحاجة لفهرس مركب
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

  // الترتيب والفلترة في الذاكرة لضمان العمل الفوري
  const portfolioItems = rawPortfolioItems 
    ? [...rawPortfolioItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    : [];

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
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
        <div className="space-y-2 text-right w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 flex items-center gap-3 justify-end md:justify-start">
            <Layout className="text-primary" /> أعمال المفهمين
          </h1>
          <p className="text-muted-foreground font-bold">تصفح النماذج التعليمية المعتمدة من خبرائنا الموثوقين.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث عن عمل أو مدرس..." 
            className="h-14 pr-12 rounded-2xl border-none shadow-sm bg-white focus:ring-2 focus:ring-primary/20 text-lg text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {isPortfolioLoading ? (
          <div className="col-span-full py-20 text-center animate-pulse font-black text-2xl opacity-20">جاري تحميل المعرض...</div>
        ) : filteredItems?.map((item) => {
          const teacher = allUsers?.find(u => u.id === item.mufhemId);
          return (
            <div key={item.id} className="space-y-4 group cursor-pointer" onClick={() => setSelectedItem({ ...item, teacher })}>
              <div className="relative aspect-[16/10] rounded-[1.5rem] overflow-hidden shadow-md bg-zinc-200">
                {item.mediaType === 'video' ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={item.mediaUrl} 
                      className="w-full h-full object-cover" 
                      muted 
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                      <PlayCircle className="text-white h-12 w-12 drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={item.mediaUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                
                <Badge className="absolute top-4 right-4 bg-[#FFC107] text-zinc-900 font-black border-none px-4 py-1.5 rounded-lg text-xs">
                  {item.mediaType === 'video' ? 'فيديو' : 'مميز'}
                </Badge>

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
                  {teacher?.specialization || "خبير تعليمي"}
                </p>
              </div>
            </div>
          );
        })}
        
        {(!filteredItems || filteredItems.length === 0) && !isPortfolioLoading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-zinc-200">
            <p className="text-2xl font-black text-zinc-300">لا توجد أعمال منشورة في هذا القسم حالياً.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-0 relative bg-zinc-900 flex items-center justify-center min-h-[400px]">
              {selectedItem?.mediaType === 'video' ? (
                <video 
                  src={selectedItem.mediaUrl} 
                  className="max-w-full h-auto max-h-[600px]" 
                  controls 
                  autoPlay 
                  playsInline 
                />
              ) : (
                <img 
                  src={selectedItem?.mediaUrl} 
                  className="max-w-full h-auto max-h-[600px] object-contain"
                  alt="Portfolio Detail"
                />
              )}
            </div>
            <div className="p-10 space-y-8 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8 text-right">
                <h2 className="text-3xl font-black text-zinc-900">{selectedItem?.title}</h2>
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-2 justify-end">
                  <Clock className="h-4 w-4" /> {selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('ar-EG') : "-"}
                </span>
              </div>

              <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-3xl border-2 border-dashed border-primary/10">
                <Button 
                  onClick={() => router.push(`/teachers?id=${selectedItem?.teacher?.id}`)}
                  variant="outline" 
                  className="rounded-2xl h-14 px-8 border-2 font-black shadow-lg"
                >
                  زيارة الملف
                </Button>
                <div className="text-right flex-1">
                  <h4 className="text-2xl font-black flex items-center justify-end gap-2">
                    {selectedItem?.teacher?.fullName}
                    {selectedItem?.teacher?.isVerified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
                  </h4>
                  <p className="text-primary font-bold text-lg mt-1">{selectedItem?.teacher?.specialization || "خبير تعليمي"}</p>
                </div>
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedItem?.teacher?.profilePictureUrl} />
                  <AvatarFallback className="text-2xl font-black">{selectedItem?.teacher?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4 text-right">
                <h5 className="text-xl font-black text-zinc-800">وصف العمل</h5>
                <p className="text-zinc-600 text-lg leading-relaxed font-medium bg-zinc-50 p-6 rounded-2xl italic">
                  "{selectedItem?.description}"
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
