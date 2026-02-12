
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, deleteDoc, updateDoc, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Layers, BookOpen, Edit3, Check, X, ListPlus, Sparkles, Filter, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminCategories() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newVal, setNewVal] = useState("");
  const [editingId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // جلب كافة التصنيفات
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleAdd = async (type: string) => {
    if (!firestore || !newVal.trim()) return;
    
    const id = doc(collection(firestore, "categories")).id;
    try {
      await setDoc(doc(firestore, "categories", id), {
        id,
        name: newVal.trim(),
        type: type, // 'main', 'sub', or 'option'
        createdAt: new Date().toISOString()
      });
      setNewVal("");
      toast({ title: "تمت الإضافة", description: "تم تحديث القائمة تلقائياً." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!firestore || !editValue.trim()) return;
    try {
      await updateDoc(doc(firestore, "categories", id), { name: editValue.trim() });
      setEditId(null);
      toast({ title: "تم التعديل بنجاح" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, "categories", id));
      toast({ title: "تم الحذف بنجاح" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline text-zinc-900">إدارة الأقسام (نظام 3 مستويات)</h1>
        <p className="text-muted-foreground text-lg">تحكم في الأقسام الرئيسية، الفرعية، والخيارات المتقدمة من مكان واحد.</p>
      </div>

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-20 p-2 bg-muted/40 rounded-[2rem] mb-10 shadow-inner">
          <TabsTrigger value="main" className="rounded-2xl text-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Layers className="ml-2" /> الصفحة 1: الأقسام الرئيسية
          </TabsTrigger>
          <TabsTrigger value="sub" className="rounded-2xl text-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Filter className="ml-2" /> الصفحة 2: الأقسام الفرعية
          </TabsTrigger>
          <TabsTrigger value="option" className="rounded-2xl text-xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Settings2 className="ml-2" /> الصفحة 3: خيارات متقدمة
          </TabsTrigger>
        </TabsList>

        {['main', 'sub', 'option'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <Card className="shadow-2xl rounded-[3rem] border-2 border-primary/10 h-fit">
                <CardHeader className="bg-primary text-white p-8">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Plus className="h-8 w-8" /> إضافة {type === 'main' ? 'قسم رئيسي' : type === 'sub' ? 'قسم فرعي' : 'خيار جديد'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="font-black text-lg">الاسم المقترح</Label>
                    <Input 
                      placeholder="اكتب هنا..." 
                      className="h-16 rounded-2xl text-xl font-bold border-2 focus:border-primary"
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => handleAdd(type)} className="w-full h-16 rounded-2xl font-black text-2xl shadow-xl shadow-primary/20">
                    حفظ وإضافة فورية
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-2xl rounded-[3rem] overflow-hidden border-2 bg-white">
                <Table>
                  <TableHeader className="bg-muted/50 h-20">
                    <TableRow>
                      <TableHead className="text-right px-10 font-black text-lg">الاسم الحالي</TableHead>
                      <TableHead className="text-right font-black text-lg">الحالة</TableHead>
                      <TableHead className="text-left px-10 font-black text-lg">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-32 animate-pulse font-black text-2xl">جاري تحميل البيانات...</TableCell></TableRow>
                    ) : (
                      categories?.filter(c => c.type === type || (!c.type && type === 'main')).map((c) => (
                        <TableRow key={c.id} className="h-24 hover:bg-primary/5 transition-colors border-b border-dashed">
                          <TableCell className="px-10">
                            {editingId === c.id ? (
                              <div className="flex gap-3">
                                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-12 w-60 rounded-xl font-bold border-2 border-primary" />
                                <Button size="icon" className="bg-green-600 rounded-xl" onClick={() => handleSaveEdit(c.id)}><Check className="h-5 w-5" /></Button>
                                <Button size="icon" variant="outline" className="rounded-xl" onClick={() => setEditId(null)}><X className="h-5 w-5" /></Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 font-black text-xl text-zinc-800">
                                <div className="bg-primary/10 p-3 rounded-2xl"><Sparkles className="h-6 w-6 text-primary" /></div>
                                {c.name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-black">نشط الآن</Badge>
                          </TableCell>
                          <TableCell className="px-10 text-left">
                            <div className="flex justify-end gap-3">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => { setEditId(c.id); setEditValue(c.name); }}
                                className="rounded-2xl h-12 w-12 border-2 hover:bg-primary/10 hover:text-primary transition-all"
                              >
                                <Edit3 className="h-5 w-5" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                onClick={() => handleDelete(c.id)}
                                className="rounded-2xl h-12 w-12 shadow-lg"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {(!categories || categories.filter(c => c.type === type).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-32 text-muted-foreground font-black text-xl opacity-30">
                          هذه القائمة فارغة حالياً.. ابدأ بإضافة أول عنصر!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
