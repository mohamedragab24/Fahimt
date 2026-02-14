
"use client";

import { useState } from "react";
import { useFirestore, useFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Lock, Mail, Phone, Fingerprint, User, ShieldCheck, Loader2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminAccountManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);

  const handleSearch = async () => {
    if (!firestore || !searchQuery.trim()) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إدخال البيانات للبحث." });
      return;
    }

    setIsSearching(true);
    setTargetUser(null);
    const text = searchQuery.trim();

    try {
      const usersRef = collection(firestore, "users");
      let foundUser = null;

      // 1. البحث بالـ ID
      const idDoc = await getDoc(doc(firestore, "users", text));
      if (idDoc.exists()) {
        foundUser = { ...idDoc.data(), id: idDoc.id };
      }

      // 2. البحث بالبريد
      if (!foundUser) {
        const qEmail = query(usersRef, where("email", "==", text.toLowerCase()), limit(1));
        const emailSnap = await getDocs(qEmail);
        if (!emailSnap.empty) {
          foundUser = { ...emailSnap.docs[0].data(), id: emailSnap.docs[0].id };
        }
      }

      // 3. البحث بالهاتف
      if (!foundUser) {
        const qPhone = query(usersRef, where("phoneNumber", "==", text), limit(1));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
          foundUser = { ...phoneSnap.docs[0].data(), id: phoneSnap.docs[0].id };
        }
      }

      if (foundUser) {
        setTargetUser(foundUser);
        toast({ title: "تم العثور على الحساب" });
      } else {
        toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على أي مستخدم بهذه البيانات." });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "فشلت عملية البحث." });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة الحسابات والوصول</h1>
        <p className="text-muted-foreground text-lg">البحث عن بيانات المستخدمين والاطلاع على كلمات المرور المسجلة.</p>
      </div>

      <Card className="max-w-3xl mx-auto shadow-2xl rounded-[3rem] border-2 overflow-hidden bg-white">
        <CardHeader className="bg-zinc-900 text-white p-10">
          <CardTitle className="text-2xl font-black flex items-center gap-4">
            <Search className="text-primary h-8 w-8" /> ابحث عن مستخدم الآن
          </CardTitle>
          <CardDescription className="text-zinc-400">أدخل البريد الإلكتروني، رقم الهاتف، أو User ID.</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="font-bold">بيانات البحث</Label>
              <Input 
                placeholder="مثال: name@example.com أو 010..." 
                className="h-16 text-xl rounded-2xl border-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 mt-8 shadow-lg shadow-primary/20"
            >
              {isSearching ? <Loader2 className="animate-spin h-6 w-6" /> : <Search className="h-6 w-6" />}
            </Button>
          </div>

          {targetUser && (
            <div className="p-10 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-sm border">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={targetUser.profilePictureUrl} />
                  <AvatarFallback className="text-3xl font-black">{targetUser.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-3xl font-black flex items-center gap-2">
                    {targetUser.fullName}
                    {targetUser.isVerified && <ShieldCheck className="text-blue-500" />}
                  </h4>
                  <Badge variant="secondary" className="px-4 py-1 text-sm font-bold">
                    {targetUser.role === 'mufhem' ? 'مفهم معتمد' : 'مستفهم طموح'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoBox icon={Mail} label="البريد الإلكتروني" value={targetUser.email} />
                <InfoBox icon={Phone} label="رقم الهاتف" value={targetUser.phoneNumber} />
                <InfoBox icon={Fingerprint} label="User ID" value={targetUser.id} full />
                
                <div className="md:col-span-2 p-8 bg-primary/5 rounded-3xl border-2 border-primary/20 space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Key size={24} className="animate-bounce" />
                    <Label className="text-xl font-black uppercase tracking-wider">كلمة المرور الحالية</Label>
                  </div>
                  <div className="relative">
                    <p className="text-4xl font-mono font-black tracking-widest text-zinc-800 break-all bg-white p-6 rounded-2xl shadow-inner border-2">
                      {targetUser.password || "غير مسجلة يدوياً"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold">* ملاحظة: كلمة المرور تظهر هنا لأنها محفوظة في Firestore لغرض الإدارة.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value, full }: any) {
  return (
    <div className={`p-6 bg-white rounded-2xl border shadow-sm space-y-1 ${full ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs">
        <Icon size={14} className="text-primary" /> {label}
      </div>
      <p className="text-lg font-black text-zinc-900 truncate">{value}</p>
    </div>
  );
}
