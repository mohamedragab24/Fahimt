
"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldAlert, ShieldCheck, Search, UserPlus, UserMinus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminRoles() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>(["support"]);

  const handleSearch = async () => {
    if (!firestore || !searchId) return;
    const userRef = doc(firestore, "users", searchId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setTargetUser({ ...snap.data(), id: snap.id });
      setPermissions(snap.data().adminPermissions || ["support"]);
    } else {
      toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على مستخدم بهذا المعرف." });
      setTargetUser(null);
    }
  };

  const toggleAdminStatus = async () => {
    if (!firestore || !targetUser) return;
    const isNowAdmin = !targetUser.isAdmin;
    
    try {
      await updateDoc(doc(firestore, "users", targetUser.id), {
        isAdmin: isNowAdmin,
        adminPermissions: isNowAdmin ? permissions : []
      });

      await addDoc(collection(firestore, "adminLogs"), {
        action: isNowAdmin ? 'grant_admin' : 'revoke_admin',
        targetUserId: targetUser.id,
        details: isNowAdmin ? `تم منح صلاحيات: ${permissions.join(', ')}` : 'تم سحب الصلاحيات',
        timestamp: new Date().toISOString()
      });

      toast({ 
        title: isNowAdmin ? "تم التعيين!" : "تم سحب الصلاحية", 
        description: `تم تحديث رتبة ${targetUser.fullName} بنجاح.` 
      });
      
      setTargetUser({ ...targetUser, isAdmin: isNowAdmin });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الصلاحيات." });
    }
  };

  const handlePermissionChange = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex justify-between items-center gap-6 border-r-8 border-red-500 pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">الإدارة والصلاحيات</h1>
          <p className="text-muted-foreground text-lg">إضافة مساعدين وتحديد صلاحياتهم داخل لوحة التحكم.</p>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto shadow-2xl rounded-[3rem] overflow-hidden border-2">
        <CardHeader className="bg-zinc-900 text-white p-10">
          <CardTitle className="text-3xl font-black flex items-center gap-4">
            <ShieldAlert className="h-10 w-10 text-red-500" /> تعيين مسؤول جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-lg font-bold">معرف المستخدم (User ID)</Label>
              <Input 
                placeholder="أدخل الـ ID الخاص بالمستخدم..." 
                className="h-16 text-xl rounded-2xl border-2 px-6"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} className="h-16 px-10 rounded-2xl font-black text-xl mt-8 bg-zinc-800 hover:bg-black">
              <Search className="h-6 w-6" />
            </Button>
          </div>

          {targetUser && (
            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage src={targetUser.profilePictureUrl} />
                  <AvatarFallback className="text-2xl">{targetUser.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-2xl font-black">{targetUser.fullName}</h4>
                  <p className="text-muted-foreground font-bold">{targetUser.email}</p>
                  <div className="mt-2">
                    {targetUser.isAdmin ? (
                      <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-black flex items-center w-fit gap-2">
                        <ShieldCheck className="h-4 w-4" /> مسؤول حالي
                      </span>
                    ) : (
                      <span className="bg-zinc-200 text-zinc-600 px-4 py-1 rounded-full text-sm font-black w-fit block">مستخدم عادي</span>
                    )}
                  </div>
                </div>
              </div>

              {!targetUser.isAdmin && (
                <div className="space-y-6 bg-white p-8 rounded-3xl border shadow-sm">
                  <h5 className="text-xl font-black flex items-center gap-3">
                    <Shield className="text-primary" /> تحديد الصلاحيات:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'finance', label: 'إدارة المالية (شحن وسحب)' },
                      { id: 'support', label: 'الدعم الفني (تذاكر الشكاوى)' },
                      { id: 'moderator', label: 'الرقابة (حظر وتوثيق)' },
                      { id: 'superadmin', label: 'سوبر أدمن (صلاحية كاملة)' }
                    ].map((p) => (
                      <div key={p.id} className="flex items-center space-x-3 space-x-reverse p-4 rounded-xl border hover:bg-zinc-50 transition-colors">
                        <Checkbox 
                          id={p.id} 
                          checked={permissions.includes(p.id)} 
                          onCheckedChange={() => handlePermissionChange(p.id)}
                        />
                        <Label htmlFor={p.id} className="cursor-pointer font-bold text-lg">{p.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={toggleAdminStatus}
                variant={targetUser.isAdmin ? "destructive" : "default"}
                className="w-full h-16 text-2xl font-black rounded-2xl shadow-xl"
              >
                {targetUser.isAdmin ? (
                  <><UserMinus className="ml-3 h-8 w-8" /> سحب رتبة المسؤول</>
                ) : (
                  <><UserPlus className="ml-3 h-8 w-8" /> تعيين كمسؤول الآن</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-zinc-100 p-8 rounded-[2.5rem] border-2 border-dashed border-zinc-300">
        <h3 className="text-xl font-black mb-4">تنبيه هام للأمان:</h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground font-bold">
          <li>تعيين مسؤول جديد يمنحه حق الوصول لبيانات المستخدمين الحساسة.</li>
          <li>تأكد من هوية الشخص قبل منحه صلاحيات "سوبر أدمن".</li>
          <li>يتم تسجيل كافة تحركات المسؤولين في "سجل العمليات" للمراقبة.</li>
        </ul>
      </div>
    </div>
  );
}
