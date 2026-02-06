
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Lock, Save, User, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
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
      title: "تم الحفظ",
      description: "تم تحديث بيانات ملفك الشخصي بنجاح.",
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (isLoading) return <div className="p-10 text-center font-bold">جاري تحميل الملف الشخصي...</div>;
  if (!profile) return null;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-headline">الملف الشخصي</h1>
          <p className="text-muted-foreground">تعديل بياناتك الشخصية وإدارة حسابك</p>
        </div>
        <Button variant="destructive" onClick={handleLogout} className="rounded-xl">
          <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
        </Button>
      </div>

      <Card className="shadow-sm border-2 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20"></div>
        <CardContent className="relative px-8 pb-8">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16 mb-8">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                <AvatarImage src={profile.profilePictureUrl || `https://picsum.photos/seed/${profile.id}/200/200`} />
                <AvatarFallback>{profile.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg border-2 border-white">
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 space-y-1 text-center md:text-right">
              <h2 className="text-2xl font-bold">{profile.fullName}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Badge className="bg-primary">{profile.role === 'mustafhem' ? 'مُستفهم' : 'مُفهم'}</Badge>
                <span className="text-sm text-muted-foreground">معرف المستخدم: {profile.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-bold">الاسم الكامل</Label>
              <div className="relative">
                <Input 
                  id="fullName" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="pr-10"
                />
                <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold flex items-center gap-2">
                البريد الإلكتروني <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input 
                id="email" 
                value={profile.email} 
                disabled 
                className="bg-muted/50 cursor-not-allowed text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold">رقم الهاتف (واتساب)</Label>
              <Input 
                id="phone" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="font-bold">تاريخ الميلاد</Label>
              <Input 
                id="birthDate" 
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 pt-6 flex justify-end">
              <Button onClick={handleSave} className="bg-primary px-8 py-6 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform">
                <Save className="ml-2 h-5 w-5" /> حفظ التعديلات
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useFirebase } from "@/firebase";
