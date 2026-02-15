
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, getDocs, doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ShieldCheck, Eye, ImageIcon, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GlobalPortfolioPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // جلب كافة الأعمال من كل المفهمين
  const portfolioQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "portfolio"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: portfolioItems, isLoading: isPortfolioLoading } = useCollection(portfolioQuery);

  // جلب كافة المستخدمين لربط الأعمال بأصحابها (تبسيط للنموذج)
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
    <div className="p-6 md:p-10 space-y-12 bg-zinc-50/50 min-h-screen" dir="rtl">
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-4">
          <ImageIcon size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-zinc-900">معرض أعمال المفهمين</h1>
        <p className="text-muted-foreground text-xl font-bold max-w-2xl mx-auto">
          استكشف مهارات وخبرات نخبة المعلمين العرب من خلال نماذج واقعية من أعمالهم.
        </p>
        
        <div className="relative mt-10 max-w-2xl mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
          <Input 
            placeholder="ابحث عن تخصص، عمل، أو اسم مفهم..." 
            className="h-16 pr-14 rounded-2xl shadow-lg border-2 bg-white focus:border-primary text-lg font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {isPortfolioLoading ? (
          <div className="col-span-full py-20 text-center animate-pulse font-black text-2xl opacity-30">جاري تجميع الإبداعات...</div>
        ) : filteredItems?.map((item) => {
          const teacher = allUsers?.find(u => u.id === item.mufhemId);
          return (
            <Card key={item.id} className="group relative rounded-[2.5rem] overflow-hidden shadow-xl border-none bg-white transition-all hover:scale-[1.02] hover:shadow-2xl">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src={item.mediaUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-right">
                  <Button 
                    onClick={() => setSelectedItem({ ...item, teacher })}
                    className="w-full bg-white text-zinc-900 hover:bg-primary hover:text-white rounded-2xl h-14 font-black text-lg shadow-xl"
                  >
                    <Eye className="ml-2" /> عرض العمل بالكامل
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-black text-zinc-800 line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-3 pt-2 border-t border-dashed">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                    <AvatarImage src={teacher?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">{teacher?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-right overflow-hidden">
                    <p className="font-bold text-sm text-zinc-900 truncate flex items-center gap-1">
                      {teacher?.fullName || "مفهم مجهول"}
                      {teacher?.isVerified && <ShieldCheck className="h-3 w-3 text-blue-500 fill-blue-500/10" />}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold truncate">{teacher?.specialization || "خبير تعليمي"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!filteredItems || filteredItems.length === 0) && !isPortfolioLoading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-zinc-200">
            <p className="text-3xl font-black text-zinc-300">لا توجد أعمال تطابق بحثك حالياً.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-0 relative">
              <img 
                src={selectedItem?.mediaUrl} 
                className="w-full h-auto max-h-[600px] object-contain bg-zinc-900"
                alt="Portfolio Detail"
              />
            </div>
            <div className="p-10 space-y-8 bg-white">
              <div className="flex items-center justify-between border-b pb-8">
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
                  <User size={20} className="text-primary" /> نبذة عن هذا العمل
                </h5>
                <p className="text-zinc-600 text-lg leading-relaxed font-medium bg-zinc-50 p-6 rounded-2xl italic">
                  "{selectedItem?.description || "هذا العمل يعبر عن المهارات التعليمية العالية التي يمتلكها المفهم في تخصصه، وهو نموذج حقيقي لما يمكن تقديمه في الجلسات المباشرة."}"
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Clock({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
