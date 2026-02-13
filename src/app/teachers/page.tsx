
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ShieldCheck, Star, Search, MessageSquare, Briefcase, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TeachersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const teachersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mufhem"), where("isProfileApproved", "==", true));
  }, [firestore]);

  const { data: teachers, isLoading } = useCollection(teachersQuery);

  // جلب أعمال المفهم المختار
  const portfolioQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTeacher?.id) return null;
    return query(collection(firestore, "portfolio"), where("mufhemId", "==", selectedTeacher.id), orderBy("createdAt", "desc"));
  }, [firestore, selectedTeacher?.id]);

  const { data: teacherPortfolio } = useCollection(portfolioQuery);

  const filteredTeachers = teachers?.filter(t => 
    t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-12" dir="rtl">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">نخبة "المفهمين" الموثقين</h1>
        <p className="text-muted-foreground text-xl">تصفح قائمة الخبراء المتاحين لمساعدتك في أي وقت.</p>
        <div className="relative mt-8">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="ابحث باسم المدرس أو التخصص (مثل: رياضيات، لغات...)" 
            className="h-16 pr-12 rounded-2xl shadow-xl text-lg border-2 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center animate-pulse font-bold text-2xl">جاري البحث عن المدرسين...</div>
        ) : filteredTeachers?.map((teacher) => (
          <Card key={teacher.id} className="rounded-[2.5rem] border-2 hover:border-primary transition-all overflow-hidden group shadow-lg hover:shadow-2xl bg-white">
            <CardHeader className="p-0 relative">
              <div className="h-32 bg-gradient-to-br from-primary to-accent"></div>
              <div className="absolute -bottom-12 right-8">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={teacher.profilePictureUrl} />
                  <AvatarFallback className="text-2xl font-black">{teacher.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
            <CardContent className="pt-16 p-8 space-y-4">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  {teacher.fullName}
                  {teacher.isVerified && <ShieldCheck className="h-5 w-5 text-blue-500 fill-blue-500/10" />}
                </h3>
                <p className="text-primary font-bold text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> {teacher.specialization || "خبير تعليمي"}
                </p>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2 h-10 font-medium text-right">
                {teacher.bio || "لا يوجد نبذة تعريفية مضافة حالياً."}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-dashed">
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star className="h-4 w-4 fill-current" /> 5.0
                </div>
                <Button 
                  onClick={() => setSelectedTeacher(teacher)}
                  variant="outline" 
                  className="rounded-xl font-bold hover:bg-primary hover:text-white"
                >
                  عرض الملف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden" dir="rtl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-6 p-8 bg-muted/20 rounded-[2.5rem]">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedTeacher?.profilePictureUrl} />
                  <AvatarFallback className="text-4xl">{selectedTeacher?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-right flex-1">
                  <h4 className="text-3xl font-black flex items-center gap-3">
                    {selectedTeacher?.fullName}
                    {selectedTeacher?.isVerified && <ShieldCheck className="h-8 w-8 text-blue-500" />}
                  </h4>
                  <Badge className="bg-primary mt-3 px-6 py-1.5 text-md font-black">{selectedTeacher?.specialization || "خبير عام"}</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-2xl font-black flex items-center gap-3 border-r-4 border-primary pr-4">
                  <Briefcase className="text-primary" /> النبذة التعريفية والخبرات
                </h5>
                <div className="p-8 bg-zinc-50 rounded-3xl border-2 border-dashed text-xl leading-relaxed text-zinc-700 italic text-right">
                  "{selectedTeacher?.bio || "لم يقم هذا المفهم بإضافة نبذة تعريفية بعد."}"
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-2xl font-black flex items-center gap-3 border-r-4 border-accent pr-4">
                  <ImageIcon className="text-accent" /> معرض الأعمال والشهادات
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {teacherPortfolio?.map(item => (
                    <Card key={item.id} className="aspect-square rounded-2xl overflow-hidden border-2 shadow-md">
                      <img src={item.mediaUrl} className="w-full h-full object-cover" alt="Portfolio" />
                    </Card>
                  ))}
                  {(!teacherPortfolio || teacherPortfolio.length === 0) && (
                    <div className="col-span-full py-10 text-center bg-muted/10 rounded-2xl text-muted-foreground font-bold italic">
                      لا توجد أعمال معروضة حالياً.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="bg-green-50 p-6 rounded-3xl text-center">
                  <p className="text-sm text-green-600 font-black">تقييم الطلاب</p>
                  <p className="text-4xl font-black text-green-700">5.0 <span className="text-lg">/ 5</span></p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl text-center">
                  <p className="text-sm text-blue-600 font-black">حالة التوثيق</p>
                  <p className="text-2xl font-black text-blue-700">{selectedTeacher?.isVerified ? "موثق رسمياً" : "نشط"}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
