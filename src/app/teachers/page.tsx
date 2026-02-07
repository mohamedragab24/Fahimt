
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ShieldCheck, Star, Search, MessageSquare, Briefcase } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function TeachersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const teachersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mufhem"));
  }, [firestore]);

  const { data: teachers, isLoading } = useCollection(teachersQuery);

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
              <p className="text-muted-foreground text-sm line-clamp-2 h-10 font-medium">
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
        <DialogContent className="sm:max-w-[600px] rounded-[3rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black">السيرة الذاتية للمفهم</DialogTitle>
            <DialogDescription className="text-right">تعرف على خبرات المدرس قبل بدء المحاضرة.</DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="py-8 space-y-8">
              <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-3xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedTeacher.profilePictureUrl} />
                  <AvatarFallback className="text-2xl">{selectedTeacher.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-2xl font-black flex items-center gap-2">
                    {selectedTeacher.fullName}
                    {selectedTeacher.isVerified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
                  </h4>
                  <Badge className="bg-primary mt-2 font-bold">{selectedTeacher.specialization || "خبير عام"}</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-xl font-black flex items-center gap-2">
                  <Briefcase className="text-primary" /> الخبرة والنبذة التعريفية
                </h5>
                <div className="p-6 bg-zinc-50 rounded-2xl border-2 border-dashed text-lg leading-relaxed text-zinc-700 italic">
                  "{selectedTeacher.bio || "لم يقم هذا المفهم بإضافة نبذة تعريفية بعد، ولكنه متاح لخدمتكم."}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-2xl text-center">
                  <p className="text-xs text-green-600 font-bold">تقييم الطلاب</p>
                  <p className="text-2xl font-black text-green-700">5.0 / 5.0</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                  <p className="text-xs text-blue-600 font-bold">حالة التوثيق</p>
                  <p className="text-2xl font-black text-blue-700">{selectedTeacher.isVerified ? "موثق" : "نشط"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
