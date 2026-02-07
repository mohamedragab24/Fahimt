
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
      createdAt: new Date().toISOString()
    });
    
    setNewCategory("");
    toast({ title: "تم الإضافة", description: `تم إضافة قسم ${newCategory} بنجاح.` });
  };

  const handleDeleteCategory = (id: string) => {
    if (!firestore) return;
    const categoryRef = doc(firestore, "categories", id);
    deleteDocumentNonBlocking(categoryRef);
    toast({ title: "تم حذف القسم", description: "تم إزالة القسم من القائمة بنجاح." });
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة الأقسام الدراسية</h1>
        <p className="text-muted-foreground text-lg">تحكم في التصنيفات المتاحة للطلاب عند طلب المحاضرات.</p>
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
              <Label className="font-bold text-lg">اسم القسم</Label>
              <Input 
                placeholder="مثال: لغات، برمجة، دراسة..." 
                className="h-14 rounded-xl text-lg border-2"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <Button onClick={handleAddCategory} className="w-full h-14 rounded-xl font-black text-xl shadow-lg">
              إضافة الآن
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
          <Table>
            <TableHeader className="bg-muted/50 h-16">
              <TableRow>
                <TableHead className="text-right px-8 font-black">اسم القسم</TableHead>
                <TableHead className="text-right font-black">تاريخ الإضافة</TableHead>
                <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 animate-pulse font-bold">جاري تحميل الأقسام...</TableCell></TableRow>
              ) : categories?.map((c) => (
                <TableRow key={c.id} className="h-20 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-8 font-bold text-lg">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm font-bold">
                    {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell className="px-8 text-left">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDeleteCategory(c.id)}
                      className="rounded-xl h-10 w-10 shadow-md hover:scale-110 transition-transform"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!categories || categories.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-muted-foreground font-bold text-xl opacity-30">
                    <div className="flex flex-col items-center gap-4">
                      <Layers size={64} />
                      لا توجد أقسام مضافة حالياً.
                    </div>
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
