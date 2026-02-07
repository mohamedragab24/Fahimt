
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, deleteDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, User, BadgeCent, Clock, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminAllRequests() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "requests"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "requests", id));
      toast({ title: "تم الحذف", description: "تم حذف الطلب بنجاح من النظام." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الطلب." });
    }
  };

  const filteredRequests = requests?.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id?.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 border-blue-500 pr-6">
        <div>
          <h1 className="text-4xl font-black font-headline">رقابة المحاضرات</h1>
          <p className="text-muted-foreground text-lg">متابعة كافة الطلبات والجلسات القائمة والمنتهية في المنصة.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالعنوان، الطالب أو المدرس..." 
            className="h-14 pr-12 rounded-2xl shadow-sm border-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black">المحاضرة</TableHead>
              <TableHead className="text-right font-black">الأطراف</TableHead>
              <TableHead className="text-right font-black">الموعد</TableHead>
              <TableHead className="text-right font-black">المبلغ</TableHead>
              <TableHead className="text-right font-black">الحالة</TableHead>
              <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse font-bold">جاري تحميل البيانات...</TableCell></TableRow>
            ) : filteredRequests?.map((req) => (
              <TableRow key={req.id} className="h-24 hover:bg-blue-50/30 transition-colors">
                <TableCell className="px-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{req.title}</span>
                    <span className="text-xs text-muted-foreground font-mono">ID: {req.id.slice(-8)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-4">طالب</Badge>
                      <span className="font-bold">{req.studentName}</span>
                    </div>
                    {req.teacherName && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-4 bg-blue-100 text-blue-700">مدرس</Badge>
                        <span className="font-bold">{req.teacherName}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(req.meetingTime).toLocaleDateString('ar-EG')}</div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(req.meetingTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </TableCell>
                <TableCell className="font-black text-blue-600">{req.amount} ج.م</TableCell>
                <TableCell>
                  <Badge className={`px-4 py-1.5 rounded-xl font-black ${
                    req.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                    req.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 
                    req.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {req.status === 'pending' ? 'بانتظار مدرس' : req.status === 'accepted' ? 'جاهزة' : req.status === 'completed' ? 'مكتملة' : 'ملغية'}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 text-left">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد من الحذف؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          سيتم حذف هذا الطلب نهائياً من قاعدة البيانات، لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(req.id)} className="bg-red-600">حذف نهائي</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
