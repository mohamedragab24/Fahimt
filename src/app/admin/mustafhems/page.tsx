
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
import { Search, UserMinus, UserCheck, Eye, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminMustafhems() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "mustafhem"));
  }, [firestore]);

  const { data: mustafhems, isLoading } = useCollection(usersQuery);

  const filtered = mustafhems?.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h1 className="text-4xl font-black font-headline border-r-8 border-green-500 pr-6">إدارة المستفهمين</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="ابحث بالاسم، ID أو البريد..." 
            className="h-14 pr-12 rounded-2xl shadow-sm border-2 focus:border-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-2">
        <Table>
          <TableHeader className="bg-muted/30 h-16">
            <TableRow>
              <TableHead className="text-right px-8 font-black">المستفهم</TableHead>
              <TableHead className="text-right font-black">ID المستخدم</TableHead>
              <TableHead className="text-right font-black">تاريخ الميلاد</TableHead>
              <TableHead className="text-right font-black">الرصيد</TableHead>
              <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse">جاري التحميل...</TableCell></TableRow>
            ) : filtered?.map((u) => (
              <TableRow key={u.id} className="h-24 hover:bg-green-50/50 transition-colors">
                <TableCell className="px-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-green-500/20">
                      <AvatarImage src={u.profilePictureUrl} />
                      <AvatarFallback>{u.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold">{u.fullName}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                  {u.id}
                </TableCell>
                <TableCell className="font-bold">{new Date(u.birthDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-black text-green-600">
                    <Wallet className="h-4 w-4" />
                    500 ج.م
                  </div>
                </TableCell>
                <TableCell className="px-8 text-left">
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-2 hover:bg-green-500 hover:text-white transition-all">
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button variant="destructive" size="icon" className="rounded-xl h-10 w-10 shadow-lg">
                      <UserMinus className="h-5 w-5" />
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
