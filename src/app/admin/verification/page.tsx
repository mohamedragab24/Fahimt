
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, addDoc, getDocs, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, XCircle, CheckCircle2, AlertCircle, Search, UserCheck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminVerification() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(userRef);

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const canReadVerifications = adminProfile?.isAdmin || isMasterAdmin;

  // جلب الطلبات المعلقة
  const verQuery = useMemoFirebase(() => {
    if (!firestore || !canReadVerifications) return null;
    return query(collection(firestore, "verificationRequests"), where("status", "==", "pending"));
  }, [firestore, canReadVerifications]);

  const { data: requests, isLoading } = useCollection(verQuery);

  // البحث عن مستخدم يدوياً لتوثيقه
  const handleManualSearch = async () => {
    if (!firestore || !searchQuery) return;
    try {
      // البحث بالـ ID أولاً
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", searchQuery), limit(1));
      const snap = await getDocs(q);
      
      let targetDoc: any = null;
      if (!snap.empty) {
        targetDoc = { ...snap.docs[0].data(), id: snap.docs[0].id };
      } else {
        // محاولة البحث بالـ ID المباشر
        const userSnap = await getDocs(query(collection(firestore, "users"), where("id", "==", searchQuery), limit(1)));
        if (userSnap.size > 0) {
            targetDoc = { ...userSnap.docs[0].data(), id: userSnap.docs[0].id };
        }
      }

      if (targetDoc) {
        setSearchedUser(targetDoc);
      } else {
        toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على المستخدم." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل البحث." });
    }
  };

  const handleAction = async (userId: string, action: 'approve' | 'reject', requestId?: string) => {
    if (!firestore) return;
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      // تحديث طلب التوثيق إن وجد
      if (requestId) {
        await updateDoc(doc(firestore, "verificationRequests", requestId), { status });
      }
      
      // تحديث حالة المستخدم
      await updateDoc(doc(firestore, "users", userId), { isVerified: action === 'approve' });
      
      // سجل العمليات
      await addDoc(collection(firestore, "adminLogs"), {
        action: action === 'approve' ? 'verify_user' : 'unverify_user',
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });

      toast({ 
        title: action === 'approve' ? "تم التوثيق!" : "تم الرفض/الإلغاء", 
        description: `تم تحديث حالة المستخدم بنجاح.` 
      });
      
      if (searchedUser?.id === userId) {
        setSearchedUser({ ...searchedUser, isVerified: action === 'approve' });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تنفيذ العملية" });
    }
  };

  if (!canReadVerifications && adminProfile) {
    return <div className="p-20 text-center font-black opacity-30 text-2xl">عذراً، لا تملك صلاحية الوصول لهذه الصفحة.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-12" dir="rtl">
      <div className="flex justify-between items-center border-r-8 border-orange-500 pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">مركز التوثيق</h1>
          <p className="text-muted-foreground text-lg">إدارة الشارات الزرقاء والتحقق من الهوية.</p>
        </div>
      </div>

      {/* البحث اليدوي والتوثيق المباشر */}
      <Card className="shadow-xl rounded-[2.5rem] border-2 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <Search className="text-orange-500" /> توثيق يدوي (بالبريد أو الـ ID)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Input 
              placeholder="أدخل البريد الإلكتروني أو User ID..." 
              className="h-14 rounded-2xl text-lg bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleManualSearch} className="h-14 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600">
              بحث
            </Button>
          </div>

          {searchedUser && (
            <div className="p-6 bg-white rounded-3xl border-2 border-dashed flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={searchedUser.profilePictureUrl} />
                  <AvatarFallback>{searchedUser.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-right flex-1">
                  <h4 className="font-black text-xl flex items-center justify-end gap-2">
                    {searchedUser.fullName}
                    {searchedUser.isVerified && <ShieldCheck className="h-5 w-5 text-blue-500 fill-blue-500/10" />}
                  </h4>
                  <p className="text-sm text-muted-foreground">{searchedUser.email}</p>
                </div>
              </div>
              <Button 
                onClick={() => handleAction(searchedUser.id, searchedUser.isVerified ? 'reject' : 'approve')}
                variant={searchedUser.isVerified ? "destructive" : "default"}
                className="rounded-xl font-bold"
              >
                {searchedUser.isVerified ? "إلغاء التوثيق" : "توثيق الحساب الآن"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* طلبات التوثيق المعلقة */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black flex items-center gap-3 justify-end">
          طلبات معلقة ({requests?.length || 0}) <Clock className="text-orange-500" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full py-20 text-center animate-pulse font-bold">جاري تحميل الطلبات...</div>
          ) : requests?.map((req) => (
            <Card key={req.id} className="shadow-lg rounded-[2.5rem] overflow-hidden border-2 hover:border-orange-500/20 transition-all">
              <CardHeader className="bg-muted/30 p-8 flex flex-col items-center gap-4 text-center">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={req.profilePictureUrl} />
                  <AvatarFallback>{req.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl font-black">{req.userName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleAction(req.userId, 'approve', req.id)}
                    className="bg-green-600 hover:bg-green-700 h-14 rounded-xl font-bold"
                  >
                    <CheckCircle2 className="ml-2 h-5 w-5" /> توثيق
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleAction(req.userId, 'reject', req.id)}
                    className="h-14 rounded-xl font-bold"
                  >
                    <XCircle className="ml-2 h-5 w-5" /> رفض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!requests || requests.length === 0) && (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-4 border-dashed text-muted-foreground font-bold">
              لا توجد طلبات توثيق معلقة حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
