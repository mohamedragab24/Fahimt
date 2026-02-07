
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
import { Search, UserMinus, UserCheck, Eye, Wallet, Mail, Phone, Calendar, Clock, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminMustafhems() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
              <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse">جاري التحميل...</TableCell></TableRow>
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
                <TableCell className="px-8 text-left">
                  <div className="flex items-center justify-end gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setSelectedUser(u)}
                      className="rounded-xl h-10 w-10 border-2 hover:bg-green-500 hover:text-white transition-all"
                    >
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black mb-2">تفاصيل المستفهم</DialogTitle>
            <DialogDescription className="text-right text-lg">عرض كافة بيانات الحساب المسجلة في النظام.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-3xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={selectedUser.profilePictureUrl} />
                  <AvatarFallback className="text-2xl">{selectedUser.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-2xl font-black">{selectedUser.fullName}</h4>
                  <Badge className="bg-green-600 mt-2 font-bold">مستفهم طموح</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={Mail} label="البريد الإلكتروني" value={selectedUser.email} />
                <DetailItem icon={Phone} label="رقم الهاتف" value={selectedUser.phoneNumber} />
                <DetailItem icon={Calendar} label="تاريخ الميلاد" value={new Date(selectedUser.birthDate).toLocaleDateString('ar-EG')} />
                <DetailItem icon={Clock} label="تاريخ الانضمام" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('ar-EG') : "غير متوفر"} />
                <DetailItem icon={Fingerprint} label="User ID" value={selectedUser.id} full />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, full }: any) {
  return (
    <div className={`space-y-1 p-4 bg-zinc-50 rounded-2xl border ${full ? 'md:col-span-2' : ''}`}>
      <Label className="flex items-center gap-2 text-muted-foreground font-bold text-xs">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <p className={`font-black break-all ${full ? 'text-xs font-mono' : 'text-md'}`}>{value}</p>
    </div>
  );
}
