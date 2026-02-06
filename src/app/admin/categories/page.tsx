
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCategories() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState("");
  const [icon, setIcon] = useState("📚");

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleAddCategory = () => {
    if (!firestore || !newCategory.trim()) return;
    
    const categoriesRef = collection(firestore, "categories");
    addDocumentNonBlocking(categoriesRef, {
      name: newCategory.trim(),
      icon: icon,
      createdAt: new Date().toISOString()
    });
    
    setNewCategory("");
    toast({ title: "تم إرسال الطلب", description: "جاري إضافة القسم الجديد للمنصة." });
  };

  const handleDeleteCategory = (id: string) => {
    if (!firestore) return;
    const categoryRef = doc(firestore, "categories", id);
    deleteDocumentNonBlocking(categoryRef);
    toast({ title: "تم طلب الحذف", description: "سيتم إزالة القسم من القائمة فوراً." });
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة الأقسام</h1>
        <p className="text-muted-foreground text-lg">أضف أو احذف الأقسام التي تظهر للطلاب عند طلب محاضرة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="shadow-xl rounded-[2.5rem] border-2">
          <CardHeader className="bg-primary text-white p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Plus className="h-6 w-6" /> إضافة قسم جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold">اسم القسم</Label>
              <Input 
                placeholder="مثال: لغات، برمجة..." 
                className="h-14 rounded-xl text-lg"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">الأيقونة (Emoji)</Label>
              <Input 
                placeholder="مثال: 💻" 
                className="h-14 rounded-xl text-center text-2xl"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <Button onClick={handleAddCategory} className="w-full h-14 rounded-xl font-black text-xl">
              إضافة الآن
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
          <Table>
            <TableHeader className="bg-muted/50 h-16">
              <TableRow>
                <TableHead className="text-right px-8 font-black">الأيقونة</TableHead>
                <TableHead className="text-right font-black">اسم القسم</TableHead>
                <TableHead className="text-right font-black">تاريخ الإضافة</TableHead>
                <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-bold">جاري التحميل...</TableCell></TableRow>
              ) : categories?.map((c) => (
                <TableRow key={c.id} className="h-20">
                  <TableCell className="px-8 text-2xl">{c.icon}</TableCell>
                  <TableCell className="font-bold text-lg">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell className="px-8 text-left">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDeleteCategory(c.id)}
                      className="rounded-xl h-10 w-10"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!categories || categories.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-bold">
                    لا توجد أقسام مضافة حالياً.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
