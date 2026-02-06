"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, BadgeCent, Clock, Send, Users, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc, collection, query, orderBy, limit, where } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
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
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-2xl shadow-sm border gap-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            {profile.role === "mufhem" ? "أهلاً يا مُفهم!" : "أهلاً يا مُستفهم!"}
            <span className="block text-primary text-4xl mt-1">{profile.fullName}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {profile.role === "mufhem" 
              ? "استكشف طلبات الاستفهام الجديدة وساعد الطلاب في رحلتهم." 
              : "اطلب المساعدة الآن في أي مجال تحتاجه وسيرد عليك الخبراء."}
          </p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="px-4 py-2 text-md flex items-center gap-2">
            <Users className="h-4 w-4" /> {profile.role === "mufhem" ? "مدرس معتمد" : "طالب طموح"}
          </Badge>
        </div>
      </div>

      {profile.role === "mustafhem" ? <StudentView profile={profile} /> : <TeacherView profile={profile} />}
    </div>
  );
}

function StudentView({ profile }: { profile: any }) {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", amount: "", category: "دراسة" });
  const { toast } = useToast();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "requests");
  }, [firestore, profile]);

  const myRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef) return null;
    return query(requestsRef, where("studentId", "==", profile.id), limit(6), orderBy("createdAt", "desc"));
  }, [requestsRef, profile.id]);

  const { data: myRequests } = useCollection(myRequestsQuery);

  const handleCreateRequest = () => {
    if (!requestsRef || !newRequest.title || !newRequest.amount) return;

    addDocumentNonBlocking(requestsRef, {
      title: newRequest.title,
      amount: Number(newRequest.amount),
      category: newRequest.category,
      status: "pending",
      studentId: profile.id,
      studentName: profile.fullName,
      studentPhone: profile.phoneNumber,
      meetingTime: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    setIsDialogOpen(false);
    setNewRequest({ title: "", amount: "", category: "دراسة" });
    toast({
      title: "تم إرسال الطلب بنجاح",
      description: "سيتم إخطار المفهمين المتاحين للرد عليك.",
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center p-16 bg-gradient-to-r from-primary via-primary/90 to-accent rounded-[2.5rem] text-white shadow-2xl text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://picsum.photos/seed/bg/1000/1000')] bg-cover"></div>
        <h2 className="text-5xl font-black font-headline max-w-3xl leading-tight relative z-10">
          إيه اللي واقف معاك؟ <br/> اسأل وهتلاقي اللي يفهِّمك بجد
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-10 py-8 text-2xl rounded-full shadow-2xl transition-all hover:scale-105 font-bold relative z-10">
              <PlusCircle className="ml-3 h-8 w-8" />
              إنشاء طلب استفهام جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-2xl font-bold">ماذا تريد أن تتعلم اليوم؟</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg">عنوان الطلب</Label>
                <Input id="title" placeholder="مثلاً: شرح درس التفاضل للصف الثالث الثانوي" value={newRequest.title} onChange={(e) => setNewRequest({...newRequest, title: e.target.value})} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-lg">التصنيف</Label>
                <Select value={newRequest.category} onValueChange={(v) => setNewRequest({...newRequest, category: v})}>
                  <SelectTrigger className="h-12">
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
                <Label htmlFor="amount" className="text-lg">المبلغ المعروض (ج.م)</Label>
                <Input id="amount" type="number" placeholder="100" value={newRequest.amount} onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})} className="h-12" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRequest} className="w-full py-7 text-xl font-bold rounded-2xl">
                <Send className="ml-3 h-6 w-6" /> إرسال الطلب الآن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold font-headline border-r-4 border-primary pr-4">طلباتك الأخيرة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myRequests && myRequests.map((req: any) => (
            <Card key={req.id} className="shadow-md border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="px-3 py-1">{req.category}</Badge>
                  <span className="text-lg font-bold text-primary">{req.amount} ج.م</span>
                </div>
                <h4 className="font-bold text-xl leading-snug h-14 line-clamp-2">{req.title}</h4>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 ml-1" />
                    {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                  <Badge className={req.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                    {req.status === 'pending' ? 'قيد الانتظار' : 'تم القبول'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!myRequests || myRequests.length === 0) && (
            <div className="col-span-full py-16 text-center text-muted-foreground border-4 border-dashed rounded-3xl text-xl">
              لا توجد طلبات سابقة.. ابدأ بطلبك الأول الآن وشوف الفرق!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeacherView({ profile }: { profile: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, "requests");
  }, [firestore, profile]);

  const availableRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef) return null;
    return query(requestsRef, where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(12));
  }, [requestsRef]);

  const { data: requests, isLoading } = useCollection(availableRequestsQuery);

  const handleAcceptRequest = (req: any) => {
    if (!firestore) return;
    const reqRef = doc(firestore, "requests", req.id);
    
    updateDocumentNonBlocking(reqRef, {
      status: "accepted",
      teacherId: profile.id,
      teacherName: profile.fullName,
      teacherPhone: profile.phoneNumber
    });

    toast({
      title: "تم قبول الطلب!",
      description: "يمكنك الآن البدء بالتواصل مع الطالب لترتيب الموعد.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-accent/5 p-6 rounded-2xl border border-accent/20">
        <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
          <BookOpen className="text-accent h-7 w-7" /> الطلبات المتاحة حالياً
        </h3>
        <Badge variant="secondary" className="px-4 py-2 font-bold animate-pulse">مُحدث الآن</Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-xl font-bold">جاري تحميل الطلبات الجديدة...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {requests && requests.map((req) => (
            <Card key={req.id} className="overflow-hidden border-2 hover:border-accent transition-all group shadow-sm hover:shadow-xl rounded-2xl">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-accent text-white px-3 py-1">{req.category}</Badge>
                  <div className="flex items-center font-bold text-accent text-xl">
                    <BadgeCent className="h-5 w-5 ml-1" />
                    {req.amount} ج.م
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mt-4 leading-snug group-hover:text-primary transition-colors h-14 line-clamp-2">
                  {req.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-sm">المستفهم:</span>
                  <div className="font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {req.studentName?.charAt(0)}
                    </div>
                    {req.studentName}
                  </div>
                </div>
                <Button 
                  onClick={() => handleAcceptRequest(req)}
                  className="w-full bg-accent hover:bg-accent/90 py-7 font-bold text-xl rounded-2xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  أنا أقدر أفهِّمك
                </Button>
              </CardContent>
            </Card>
          ))}
          {(!requests || requests.length === 0) && (
            <div className="col-span-full py-20 text-center text-muted-foreground border-4 border-dashed rounded-3xl text-xl">
              لا توجد طلبات استفهام حالياً.. استرح قليلاً وسنعلمك عند ظهور طلبات جديدة.
            </div>
          )}
        </div>
      )}
    </div>
  );
}