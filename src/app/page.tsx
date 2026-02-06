
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, BadgeCent, Clock, Send, Users, Sparkles, TrendingUp, CalendarDays, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري التحميل...</div>;
  if (!user || !profile) return null;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
      <div className="relative overflow-hidden bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-primary/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="text-primary h-6 w-6 md:h-8 md:w-8" />
              {profile.role === "mufhem" ? "أهلاً يا مُفهم!" : "أهلاً يا مُستفهم!"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="block text-primary text-4xl md:text-6xl font-black">{profile.fullName || "مستخدم فهمني"}</span>
              {profile.role === 'mufhem' && (
                <div className="bg-blue-500 p-1.5 rounded-full shadow-lg animate-pulse">
                  <ShieldCheck className="text-white h-6 w-6 md:h-8 md:w-8" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed">
              {profile.role === "mufhem" 
                ? "لديك فرصة لمساعدة الطلاب ومشاركة خبراتك وتحقيق دخل إضافي اليوم." 
                : "ابحث عن المساعدة التي تحتاجها في دراستك أو مهاراتك من أفضل الخبراء الموثقين."}
            </p>
          </div>
          <div className="flex flex-col items-center bg-primary/5 p-6 md:p-8 rounded-3xl border-2 border-primary/10">
            <TrendingUp className="text-primary h-8 w-8 md:h-10 md:w-10 mb-2" />
            <span className="text-xs md:text-sm text-muted-foreground font-bold">الرتبة الحالية</span>
            <Badge className="mt-2 px-6 py-2 text-md font-bold bg-primary shadow-lg flex items-center gap-2">
              {profile.role === "mufhem" ? (
                <><ShieldCheck className="h-4 w-4" /> مُفهم معتمد</>
              ) : "مُستفهم طموح"}
            </Badge>
          </div>
        </div>
      </div>

      {profile.role === "mustafhem" ? <StudentView profile={profile} /> : <TeacherView profile={profile} />}
    </div>
  );
}

function StudentView({ profile }: { profile: any }) {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", amount: "", category: "", meetingTime: "" });
  const { toast } = useToast();

  const requestsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "requests");
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: categories } = useCollection(categoriesQuery);

  const myRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef || !profile?.id) return null;
    return query(
      requestsRef, 
      where("studentId", "==", profile.id), 
      limit(20)
    );
  }, [requestsRef, profile?.id]);

  const { data: rawRequests } = useCollection(myRequestsQuery);
  
  const myRequests = rawRequests 
    ? [...rawRequests].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
    : [];

  const handleCreateRequest = () => {
    if (!requestsRef || !newRequest.title || !newRequest.amount || !newRequest.meetingTime || !newRequest.category) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال جميع بيانات الطلب بما في ذلك موعد المحاضرة والقسم." });
      return;
    }

    addDocumentNonBlocking(requestsRef, {
      title: newRequest.title,
      amount: Number(newRequest.amount),
      category: newRequest.category,
      status: "pending",
      studentId: profile.id,
      studentName: profile.fullName || "مستفهم",
      studentEmail: profile.email || "",
      studentPhone: profile.phoneNumber || "",
      createdAt: new Date().toISOString(),
      meetingTime: new Date(newRequest.meetingTime).toISOString()
    });

    setIsDialogOpen(false);
    setNewRequest({ title: "", amount: "", category: "", meetingTime: "" });
    toast({
      title: "تم إرسال الطلب بنجاح",
      description: "سيتم إخطارك فور قبول أحد المفهمين لطلبك وإرسال رابط الاجتماع لبريدك.",
    });
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center justify-center p-8 md:p-20 bg-gradient-to-br from-primary via-primary to-accent rounded-[2.5rem] md:rounded-[3.5rem] text-white shadow-2xl text-center space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://picsum.photos/seed/learn/1000/1000')] bg-cover transition-transform group-hover:scale-110 duration-1000"></div>
        <h2 className="text-3xl md:text-6xl font-black font-headline max-w-4xl leading-tight relative z-10 drop-shadow-lg">
          إيه اللي واقف معاك؟ <br/> اسأل وهتلاقي اللي يفهِّمك بجد
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 md:px-14 py-6 md:py-10 text-lg md:text-3xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:scale-105 font-black relative z-10">
              <PlusCircle className="ml-4 h-6 w-6 md:h-10 md:w-10" />
              اطلب استفهام الآن
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-3xl font-bold">ماذا تريد أن تتعلم اليوم؟</DialogTitle>
              <DialogDescription className="text-right text-lg">حدد موعداً مناسباً ووصفاً دقيقاً ليتمكن المدرس من مساعدتك.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-bold">عنوان الطلب</Label>
                <Input id="title" placeholder="مثلاً: شرح درس التفاضل للصف الثالث الثانوي" value={newRequest.title} onChange={(e) => setNewRequest({...newRequest, title: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-lg font-bold">التصنيف</Label>
                  <Select value={newRequest.category} onValueChange={(v) => setNewRequest({...newRequest, category: v})}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                      ))}
                      {(!categories || categories.length === 0) && (
                        <SelectItem value="عام" disabled>لا توجد أقسام حالياً</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-lg font-bold">المبلغ (ج.م)</Label>
                  <Input id="amount" type="number" placeholder="100" value={newRequest.amount} onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})} className="h-12 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingTime" className="text-lg font-bold">تاريخ ووقت المحاضرة المطلوب</Label>
                <Input 
                  id="meetingTime" 
                  type="datetime-local" 
                  value={newRequest.meetingTime} 
                  onChange={(e) => setNewRequest({...newRequest, meetingTime: e.target.value})} 
                  className="h-12 rounded-xl font-bold"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRequest} className="w-full py-6 text-xl font-black rounded-xl">
                <Send className="ml-3 h-6 w-6" /> إرسال الطلب الآن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl md:text-3xl font-black font-headline border-r-8 border-primary pr-6">طلباتك الأخيرة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myRequests && myRequests.map((req: any) => (
            <Card key={req.id} className="shadow-lg border-2 hover:border-primary/50 hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden group">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="px-4 py-1 text-md font-bold bg-primary/10 text-primary border-none">{req.category}</Badge>
                  <span className="text-2xl font-black text-primary">{req.amount} ج.م</span>
                </div>
                <h4 className="font-bold text-2xl leading-tight h-16 line-clamp-2 group-hover:text-primary transition-colors">{req.title}</h4>
                <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 p-3 rounded-xl">
                  <CalendarDays className="h-5 w-5" />
                  <span className="text-sm">{new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {req.teacherName && (
                  <div className="flex items-center gap-2 pt-2 text-sm font-bold text-blue-600">
                    <ShieldCheck className="h-4 w-4" />
                    المُفهم: {req.teacherName}
                  </div>
                )}
                <div className="flex justify-between items-center pt-6 border-t border-dashed">
                  <div className="flex items-center text-md text-muted-foreground font-medium">
                    <Clock className="h-5 w-5 ml-2 text-primary/60" />
                    {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                  <Badge className={`px-4 py-1 text-md font-bold ${
                    req.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                    req.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 
                    req.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'accepted' ? 'تم القبول' : req.status === 'completed' ? 'مكتمل' : 'ملغي'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!myRequests || myRequests.length === 0) && (
            <div className="col-span-full py-24 text-center text-muted-foreground border-4 border-dashed rounded-[3rem] text-xl md:text-2xl font-bold bg-muted/5">
              لا توجد طلبات سابقة.. ابدأ بطلبك الأول الآن!
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
    if (!firestore) return null;
    return collection(firestore, "requests");
  }, [firestore]);

  const availableRequestsQuery = useMemoFirebase(() => {
    if (!requestsRef) return null;
    return query(
      requestsRef, 
      where("status", "==", "pending"),
      limit(20)
    );
  }, [requestsRef]);

  const { data: rawRequests, isLoading } = useCollection(availableRequestsQuery);
  
  const requests = rawRequests 
    ? [...rawRequests].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const handleAcceptRequest = (req: any) => {
    if (!firestore || !profile) return;
    const reqRef = doc(firestore, "requests", req.id);
    
    updateDocumentNonBlocking(reqRef, {
      status: "accepted",
      teacherId: profile.id,
      teacherName: profile.fullName || "مفهم",
      teacherPhone: profile.phoneNumber || ""
    });

    toast({
      title: "تم قبول الطلب بنجاح!",
      description: `لقد قبلت طلب ${req.studentName}. تم إرسال إشعار له برابط المحاضرة.`,
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-accent/5 p-6 md:p-8 rounded-[2rem] border-2 border-accent/20 shadow-sm">
        <h3 className="text-xl md:text-3xl font-black font-headline flex items-center gap-4">
          <BookOpen className="text-accent h-6 w-6 md:h-10 md:w-10" /> الطلبات المتاحة
        </h3>
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 bg-accent rounded-full animate-pulse"></div>
          <span className="text-sm md:text-lg font-bold text-accent">بانتظار المفهمين الموثقين</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-24 text-2xl font-black animate-pulse">جاري البحث عن طلبات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {requests && requests.map((req) => (
            <Card key={req.id} className="overflow-hidden border-2 hover:border-accent transition-all group shadow-xl hover:shadow-2xl rounded-[2.5rem] bg-white">
              <CardHeader className="bg-muted/30 pb-6 px-8 pt-8">
                <div className="flex justify-between items-start">
                  <Badge className="bg-accent text-white px-4 py-1 text-md font-bold rounded-lg shadow-sm">{req.category}</Badge>
                  <div className="flex items-center font-black text-accent text-3xl tabular-nums">
                    <BadgeCent className="h-6 w-6 ml-2" />
                    {req.amount}
                  </div>
                </div>
                <CardTitle className="text-2xl font-black mt-6 leading-tight group-hover:text-primary transition-colors h-16 line-clamp-2">
                  {req.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-accent font-bold mt-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">{new Date(req.meetingTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col gap-3">
                  <span className="text-muted-foreground text-sm font-bold">المستفهم:</span>
                  <div className="font-bold text-xl flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black border-2 border-primary/20">
                      {(req.studentName || "ف")?.charAt(0)}
                    </div>
                    {req.studentName || "مستفهم"}
                  </div>
                </div>
                <Button 
                  onClick={() => handleAcceptRequest(req)}
                  className="w-full bg-accent hover:bg-accent/90 py-8 md:py-10 font-black text-2xl rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.03]"
                >
                  أنا أقدر أفهِّمك
                </Button>
              </CardContent>
            </Card>
          ))}
          {(!requests || requests.length === 0) && (
            <div className="col-span-full py-32 text-center text-muted-foreground border-4 border-dashed rounded-[3rem] text-xl md:text-2xl font-bold bg-muted/5">
              لا توجد طلبات استفهام حالياً.. سنعلمك عند ظهور أي طلب جديد.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
