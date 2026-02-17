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

/**
 * صفحة رقابة المحاضرات - تعرض كافة الاستفهامات في النظام بكافة حالاتها.
 */
export default function AdminAllRequests() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "istifhams"), orderBy("createdAt", "desc"), limit(200));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "istifhams", id));
      toast({ title: "تم الحذف", description: "تم حذف الاستفهام بنجاح من النظام." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الاستفهام." });
    }
  };

  const filteredRequests = requests?.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mustafhemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mufhemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge className="bg-orange-100 text-orange-600 border-none font-black">قيد المراجعة</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-600 border-none font-black">بانتظار مفهم</Badge>;
      case 'accepted':
        return <Badge className="bg-yellow-100 text-yellow-700 border-none font-black">بانتظار الدفع</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-600 border-none font-black">مدفوع وجاهز</Badge>;
      case 'completed':
        return <Badge className="bg-zinc-100 text-zinc-600 border-none font-black">مكتمل</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-600 border-none font-black">ملغي</Badge>;
      case 'pending_review':
        return <Badge className="bg-purple-100 text-purple-600 border-none font-black">نزاع/مراجعة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 border-primary pr-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">رقابة المحاضرات</h1>
          <p className="text-muted-foreground text-lg">متابعة كافة الاستفهامات والجلسات القائمة والمنتهية في المنصة.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالعنوان، المستفهم أو المفهم..." 
            className="h-14 pr-12 rounded-2xl shadow-sm border-2 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black text-zinc-900">المحاضرة</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الأطراف</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الموعد</TableHead>
              <TableHead className="text-right font-black text-zinc-900">المبلغ</TableHead>
              <TableHead className="text-right font-black text-zinc-900">الحالة</TableHead>
              <TableHead className="text-left px-8 font-black text-zinc-900">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse font-bold text-xl">جاري تحميل السجلات...</TableCell></TableRow>
            ) : filteredRequests?.map((req) => (
              <TableRow key={req.id} className="h-24 hover:bg-primary/5 transition-colors">
                <TableCell className="px-8">
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-lg text-zinc-800 line-clamp-1">{req.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {req.id.slice(-8)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm space-y-1 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-bold">{req.mustafhemName}</span>
                      <Badge variant="outline" className="text-[8px] h-4">مستفهم</Badge>
                    </div>
                    {req.mufhemName && (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-bold text-primary">{req.mufhemName}</span>
                        <Badge className="text-[8px] h-4 bg-primary/10 text-primary border-none">مفهم</Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs font-bold text-muted-foreground text-right">
                    <div className="flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> {req.meetingTime ? new Date(req.meetingTime).toLocaleDateString('ar-EG') : '-'}</div>
                    <div className="flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> {req.meetingTime ? new Date(req.meetingTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-black text-primary text-lg">{req.amount} ج.م</span>
                </TableCell>
                <TableCell className="text-right">
                  {getStatusBadge(req.status)}
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
                          سيتم حذف هذا الاستفهام نهائياً من قاعدة البيانات، لا يمكن التراجع عن هذا الإجراء.
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
            {(!filteredRequests || filteredRequests.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-black opacity-30 text-xl">لا توجد سجلات مطابقة.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
