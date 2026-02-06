
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, PenTool, Code, BadgeCent, Clock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc, collection, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

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

      {profile.role === "mustafhem" ? <StudentView userId={user.uid} /> : <TeacherView />}
    </div>
  );
}

function StudentView({ userId }: { userId: string }) {
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", amount: "", category: "دراسة" });
  const { toast } = useToast();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users", userId, "requests");
  }, [firestore, userId]);

  const recentRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef) return null;
    return query(requestsRef, limit(5));
  }, [requestsRef]);

  const { data: myRequests } = useCollection(recentRequestsQuery);

  const handleCreateRequest = () => {
    if (!requestsRef || !newRequest.title || !newRequest.amount) return;

    addDocumentNonBlocking(requestsRef, {
      title: newRequest.title,
      amount: Number(newRequest.amount),
      category: newRequest.category,
      status: "pending",
      studentId: userId,
      meetingTime: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    setIsDialogOpen(false);
    setNewRequest({ title: "", amount: "", category: "دراسة" });
    toast({
      title: "تم إرسال الطلب",
      description: "سيقوم المفهومون بمراجعة طلبك والرد عليك قريباً.",
    });
  };

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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-7 text-xl rounded-full shadow-lg transition-transform hover:scale-105 font-bold">
              <PlusCircle className="ml-2 h-6 w-6" />
              إنشاء طلب استفهام جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">ماذا تريد أن تتعلم؟</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الطلب</Label>
                <Input id="title" placeholder="مثلاً: شرح درس التفاضل" value={newRequest.title} onChange={(e) => setNewRequest({...newRequest, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Select value={newRequest.category} onValueChange={(v) => setNewRequest({...newRequest, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="دراسة">دراسة</SelectItem>
                    <SelectItem value="تقنية">تقنية</SelectItem>
                    <SelectItem value="مهارات يدوية">مهارات يدوية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ المعروض (ج.م)</Label>
                <Input id="amount" type="number" placeholder="100" value={newRequest.amount} onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRequest} className="w-full py-6 text-lg font-bold">
                <Send className="ml-2 h-5 w-5" /> إرسال الطلب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold font-headline">طلباتك الأخيرة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myRequests && myRequests.map((req: any) => (
            <Card key={req.id} className="shadow-sm border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary">{req.category}</Badge>
                  <span className="text-sm font-bold text-primary">{req.amount} ج.م</span>
                </div>
                <h4 className="font-bold">{req.title}</h4>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 ml-1" />
                  {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!myRequests || myRequests.length === 0) && (
            <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              لا توجد طلبات سابقة.. ابدأ بطلبك الأول الآن!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeacherView() {
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
