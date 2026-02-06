
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, PenTool, Code, Search, Clock, BadgeCent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc, collection, query, where, limit } from "firebase/firestore";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;
  if (!user || !profile) return null;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            {profile.role === "mufhem" ? "أهلاً يا مُفهم!" : "أهلاً يا مُستفهم!"}
            <span className="block text-primary text-3xl mt-1">{profile.fullName}</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {profile.role === "mufhem" 
              ? "استكشف الطلبات الجديدة وابدأ في نشر المعرفة." 
              : "اطلب المساعدة الآن في أي مجال تحتاجه."}
          </p>
        </div>
      </div>

      {profile.role === "mustafhem" ? <StudentView /> : <TeacherView />}
    </div>
  );
}

function StudentView() {
  const categories = [
    { name: "دراسة", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
    { name: "تقنية", icon: Code, color: "bg-purple-100 text-purple-600" },
    { name: "مهارات يدوية", icon: PenTool, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-r from-primary to-accent rounded-3xl text-white shadow-xl text-center space-y-6">
        <h2 className="text-4xl font-black font-headline max-w-2xl leading-tight">
          إيه اللي واقف معاك؟ <br/> اسأل وهتلاقي اللي يفهمك
        </h2>
        <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-7 text-xl rounded-full shadow-lg transition-transform hover:scale-105 font-bold">
          <PlusCircle className="ml-2 h-6 w-6" />
          إنشاء طلب استفهام جديد
        </Button>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold font-headline">تصنيفات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.name} className="hover:border-primary transition-colors cursor-pointer group shadow-sm">
              <CardContent className="flex items-center p-6 gap-4">
                <div className={`${cat.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <cat.icon className="h-8 w-8" />
                </div>
                <span className="text-lg font-bold">{cat.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherView() {
  const { firestore } = useFirebase();
  
  const allRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // For MVP, we fetch a few pending requests from all users or specific logic
    // Since requests are nested, a production app would use collectionGroup
    // For simplicity, we'll show a placeholder message if we can't do cross-user listing easily in path-based model
    return null; 
  }, [firestore]);

  // Using mock for visual if listing all users' requests is restricted by path-based rules
  const mockRequests = [
    { id: "1", title: "مساعدة في حل مسائل تفاضل وتكامل", amount: 150, category: "دراسة", student: "ياسين محمد" },
    { id: "2", title: "تعلم أساسيات لغة React", amount: 250, category: "تقنية", student: "سارة محمود" },
    { id: "3", title: "شرح طريقة عمل الكروشيه", amount: 100, category: "مهارات يدوية", student: "نور هاني" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold font-headline">الطلبات المتاحة حالياً</h3>
        <Badge variant="secondary" className="px-4 py-1">تحديث تلقائي</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRequests.map((req) => (
          <Card key={req.id} className="overflow-hidden border-2 hover:border-accent transition-all group">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <Badge className="bg-accent">{req.category}</Badge>
                <div className="flex items-center font-bold text-accent">
                  <BadgeCent className="h-4 w-4 ml-1" />
                  {req.amount} ج.م
                </div>
              </div>
              <CardTitle className="text-lg font-bold mt-2 leading-snug group-hover:text-primary transition-colors">
                {req.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Search className="h-4 w-4" />
                <span>المستفهم: {req.student}</span>
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 py-6 font-bold text-lg rounded-xl">
                أنا أقدر أفهمك
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useFirebase } from "@/firebase";
