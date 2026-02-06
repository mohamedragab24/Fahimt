"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Lock, Save, User, LogOut, Phone, Calendar as CalendarIcon, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ProfilePage() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading } = useDoc(userRef);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    birthDate: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phoneNumber || "",
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : ""
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!userRef) return;
    updateDocumentNonBlocking(userRef, {
      fullName: formData.fullName,
      phoneNumber: formData.phone,
      birthDate: formData.birthDate
    });
    toast({
      title: "تم تحديث البيانات",
      description: "تم حفظ تغييرات ملفك الشخصي بنجاح.",
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (isLoading) return <div className="p-10 text-center font-bold">جاري تحميل البيانات...</div>;
  if (!profile) return null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2 border-r-8 border-primary pr-6">
          <h1 className="text-5xl font-black font-headline tracking-tight">إعدادات الملف الشخصي</h1>
          <p className="text-muted-foreground text-xl">إدارة بياناتك الشخصية وخصوصية حسابك.</p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          className="rounded-2xl px-8 py-8 font-bold text-lg shadow-xl hover:scale-105 transition-all"
        >
          <LogOut className="ml-3 h-5 w-5" /> تسجيل الخروج
        </Button>
      </div>

      <Card className="shadow-[0_40px_80px_rgba(0,0,0,0.1)] border-2 border-primary/5 overflow-hidden rounded-[3.5rem] bg-white">
        <div className="h-48 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        </div>
        
        <CardContent className="relative px-12 pb-16">
          <div className="flex flex-col md:flex-row items-end gap-10 -mt-24 mb-16">
            <div className="relative group">
              <Avatar className="h-48 w-48 border-8 border-white shadow-2xl transition-transform hover:scale-[1.02]">
                <AvatarImage src={profile.profilePictureUrl || `https://picsum.photos/seed/${profile.id}/300/300`} />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                  {profile.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                className="absolute bottom-4 right-4 rounded-2xl h-14 w-14 shadow-2xl border-4 border-white hover:scale-110 transition-transform bg-primary"
              >
                <Camera className="h-7 w-7" />
              </Button>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-right">
              <div className="space-y-1">
                <h2 className="text-4xl font-black tracking-tight">{profile.fullName}</h2>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-primary text-white px-6 py-1.5 text-md font-black rounded-full shadow-lg">
                    {profile.role === 'mustafhem' ? 'مُستفهم طموح' : 'مُفهم معتمد'}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-bold bg-muted px-4 py-1.5 rounded-full">ID: {profile.id.slice(0, 12)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <Label htmlFor="fullName" className="text-xl font-black flex items-center gap-3">
                <User className="h-5 w-5 text-primary" /> الاسم بالكامل
              </Label>
              <Input 
                id="fullName" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary transition-all px-6 bg-muted/5 shadow-inner"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="email" className="text-xl font-black flex items-center gap-3 text-muted-foreground/60">
                <Mail className="h-5 w-5" /> البريد الإلكتروني <Lock className="h-4 w-4" />
              </Label>
              <Input 
                id="email" 
                value={profile.email} 
                disabled 
                className="h-16 text-xl font-bold rounded-2xl bg-muted/40 border-none cursor-not-allowed text-muted-foreground/60 px-6 shadow-inner opacity-50"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="phone" className="text-xl font-black flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" /> رقم الهاتف (للتواصل)
              </Label>
              <Input 
                id="phone" 
                value={formData.phone}
                placeholder="01xxxxxxxxx"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary transition-all px-6 bg-muted/5 shadow-inner"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="birthDate" className="text-xl font-black flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-primary" /> تاريخ الميلاد
              </Label>
              <Input 
                id="birthDate" 
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="h-16 text-xl font-bold rounded-2xl border-2 focus:border-primary transition-all px-6 bg-muted/5 shadow-inner"
              />
            </div>

            <div className="md:col-span-2 pt-12 flex justify-center md:justify-end">
              <Button 
                onClick={handleSave} 
                className="bg-primary px-16 py-10 rounded-[2rem] font-black text-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:scale-105 transition-all active:scale-95 group"
              >
                <Save className="ml-4 h-8 w-8 group-hover:animate-bounce" /> حفظ التعديلات الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-primary/5 p-10 rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col md:flex-row items-center gap-8 shadow-inner">
        <div className="bg-primary/10 p-6 rounded-3xl">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <div className="flex-1 space-y-2 text-center md:text-right">
          <h3 className="text-2xl font-black text-primary">أمان بياناتك هو أولويتنا</h3>
          <p className="text-muted-foreground text-lg leading-relaxed">
            بياناتك الشخصية مشفرة بالكامل ولا يتم مشاركتها إلا مع الطرف الآخر لغرض التواصل التعليمي فقط.
          </p>
        </div>
      </div>
    </div>
  );
}