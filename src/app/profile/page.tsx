
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Lock, Save, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: "أحمد علي",
    email: "ahmed.ali@example.com",
    phone: "01012345678",
    birthDate: "1995-10-15",
    role: "student" as "student" | "teacher"
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline">الملف الشخصي</h1>
        <p className="text-muted-foreground">تعديل بياناتك الشخصية وإدارة حسابك</p>
      </div>

      <Card className="shadow-sm border-2 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20"></div>
        <CardContent className="relative px-8 pb-8">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16 mb-8">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                <AvatarImage src="https://picsum.photos/seed/user123/200/200" />
                <AvatarFallback>أ</AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg border-2 border-white">
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 space-y-1 text-center md:text-right">
              <h2 className="text-2xl font-bold">{formData.fullName}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Badge className="bg-primary">{formData.role === 'student' ? 'مُستفهم' : 'مُفهم'}</Badge>
                <span className="text-sm text-muted-foreground">عضو منذ مايو 2024</span>
              </div>
            </div>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
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
                value={formData.email} 
                disabled 
                className="bg-muted/50 cursor-not-allowed text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">لا يمكن تغيير البريد الإلكتروني بعد إنشاء الحساب</p>
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

            {formData.role === 'teacher' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio" className="font-bold">نبذة تعريفية (تظهر للمستفهمين)</Label>
                <textarea 
                  id="bio"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="تحدث قليلاً عن خبراتك..."
                ></textarea>
              </div>
            )}

            <div className="md:col-span-2 pt-6 flex justify-end">
              <Button className="bg-primary px-8 py-6 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform">
                <Save className="ml-2 h-5 w-5" /> حفظ التعديلات
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
