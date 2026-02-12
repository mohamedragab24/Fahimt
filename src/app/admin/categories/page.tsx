
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Layers, BookOpen, Edit3, Check, X, ListPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminCategories() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleAddCategory = async () => {
    if (!firestore || !newCategory.trim()) return;
    
    const id = doc(collection(firestore, "categories")).id;
    try {
      await setDoc(doc(firestore, "categories", id), {
        id,
        name: newCategory.trim(),
        createdAt: new Date().toISOString(),
        options: [] // خيارات إضافية تحت القسم
      });
      setNewCategory("");
      toast({ title: "تم الإضافة", description: `تم إضافة قسم ${newCategory} بنجاح.` });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة القسم." });
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!firestore || !editValue.trim()) return;
    try {
      await updateDoc(doc(firestore, "categories", id), { name: editValue.trim() });
      setEditId(null);
      toast({ title: "تم التعديل", description: "تم تحديث اسم القسم بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "categories", id));
      toast({ title: "تم الحذف", description: "تم إزالة القسم من القائمة بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">إدارة الأقسام الدراسية</h1>
        <p className="text-muted-foreground text-lg">تحكم في التصنيفات والخيارات المتاحة للطلاب.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="shadow-xl rounded-[2.5rem] border-2 border-primary/10">
          <CardHeader className="bg-primary text-white p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Plus className="h-6 w-6" /> إضافة قسم رئيسي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-lg">اسم القسم</Label>
              <Input 
                placeholder="مثال: لغات، برمجة، طب..." 
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
                <TableHead className="text-right font-black">الحالة</TableHead>
                <TableHead className="text-left px-8 font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 animate-pulse font-bold">جاري تحميل الأقسام...</TableCell></TableRow>
              ) : categories?.map((c) => (
                <TableRow key={c.id} className="h-20 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-8">
                    {editingId === c.id ? (
                      <div className="flex gap-2">
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-10 w-40 rounded-lg" />
                        <Button size="icon" variant="outline" onClick={() => handleSaveEdit(c.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="icon" variant="outline" onClick={() => setEditId(null)}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 font-bold text-lg">
                        <div className="bg-primary/10 p-2 rounded-lg"><BookOpen className="h-5 w-5 text-primary" /></div>
                        {c.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full">نشط</Badge>
                  </TableCell>
                  <TableCell className="px-8 text-left">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditId(c.id); setEditValue(c.name); }}
                        className="rounded-xl h-10 w-10 border hover:bg-primary/5"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDeleteCategory(c.id)}
                        className="rounded-xl h-10 w-10 shadow-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
