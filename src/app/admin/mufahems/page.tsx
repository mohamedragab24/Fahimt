
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserMinus, UserCheck, Eye, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminMufahems() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mufhem"));
  }, [firestore]);

  const { data: mufahems, isLoading } = useCollection(usersQuery);

  const filteredMufahems = mufahems?.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.includes(searchTerm)
  );

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await updateDoc(doc(firestore, "users", userId), { status: newStatus });
      toast({ title: "تم التحديث", description: `تم تغيير حالة المستخدم إلى ${newStatus === 'active' ? 'نشط' : 'محظور'}` });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة المستخدم" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h1 className="text-4xl font-black font-headline border-r-8 border-accent pr-6">إدارة المفهمين</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالاسم، ID أو البريد..." 
            className="h-14 pr-12 rounded-2xl shadow-sm border-2 focus:border-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black">المفهم</TableHead>
              <TableHead className="text-right font-black">ID المستخدم</TableHead>
              <TableHead className="text-right font-black">التواصل</TableHead>
              <TableHead className="text-right font-black">الحالة</TableHead>
              <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse">جاري التحميل...</TableCell></TableRow>
            ) : filteredMufahems?.map((u) => (
              <TableRow key={u.id} className="h-24 hover:bg-accent/5 transition-colors">
                <TableCell className="px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-accent/20">
                      <AvatarImage src={u.profilePictureUrl} />
                      <AvatarFallback>{u.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold flex items-center gap-2">
                        {u.fullName}
                        {u.isVerified && <ShieldCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" />}
                      </span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm font-bold text-muted-foreground">
                  {u.id?.slice(0, 12)}...
                </TableCell>
                <TableCell className="font-bold">{u.phoneNumber}</TableCell>
                <TableCell>
                  <Badge className={`px-4 py-1.5 rounded-xl font-black ${u.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {u.status === 'blocked' ? 'محظور' : 'نشط'}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 text-left">
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-2 hover:bg-accent hover:text-white transition-all">
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant={u.status === 'blocked' ? 'default' : 'destructive'} 
                      size="icon" 
                      onClick={() => handleStatusChange(u.id, u.status)}
                      className="rounded-xl h-10 w-10 shadow-lg"
                    >
                      {u.status === 'blocked' ? <UserCheck className="h-5 w-5" /> : <UserMinus className="h-5 w-5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
