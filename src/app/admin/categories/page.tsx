
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit3, Check, X, ChevronRight, Layers, Filter, Settings2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminCategories() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newVal, setNewVal] = useState("");
  const [editingId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [parentForSub, setParentForSub] = useState<any>(null); // للتحكم في أي قسم نضيف تحته

  // جلب كافة التصنيفات
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "categories"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: allCategories, isLoading } = useCollection(categoriesQuery);

  const handleAdd = async (type: 'main' | 'sub' | 'option', parentId: string | null = null) => {
    if (!firestore || !newVal.trim()) return;
    
    const id = doc(collection(firestore, "categories")).id;
    try {
      await setDoc(doc(firestore, "categories", id), {
        id,
        name: newVal.trim(),
        type: type,
        parentId: parentId,
        createdAt: new Date().toISOString()
      });
      setNewVal("");
      setParentForSub(null);
      toast({ title: "تمت الإضافة بنجاح" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في الإضافة" });
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

  const mainCategories = allCategories?.filter(c => c.type === 'main' || !c.type) || [];

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black font-headline text-zinc-900">إدارة الأقسام الهرمية</h1>
          <p className="text-muted-foreground text-lg">نظام (قسم &gt; تخصص &gt; خيار) لضمان تنظيم احترافي للطلبات.</p>
        </div>
        <div className="flex gap-4">
          <Input 
            placeholder="اسم قسم رئيسي جديد..." 
            className="h-14 w-64 rounded-xl border-2 font-bold"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
          />
          <Button onClick={() => handleAdd('main')} className="h-14 px-8 rounded-xl font-black shadow-lg">
            <Plus className="ml-2" /> إضافة قسم رئيسي
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse font-black text-2xl">جاري تحميل هيكل الأقسام...</div>
        ) : (
          mainCategories.map((main) => (
            <Card key={main.id} className="shadow-xl rounded-[2.5rem] border-2 border-primary/10 overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 p-8 border-b flex flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-3 rounded-2xl text-white">
                    <Layers size={24} />
                  </div>
                  {editingId === main.id ? (
                    <div className="flex gap-2">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-10 w-48 font-bold" />
                      <Button size="sm" onClick={() => handleSaveEdit(main.id)}><Check size={16} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X size={16} /></Button>
                    </div>
                  ) : (
                    <CardTitle className="text-2xl font-black text-primary">{main.name}</CardTitle>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditId(main.id); setEditValue(main.name); }} className="rounded-xl"><Edit3 size={16} /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(main.id)} className="rounded-xl"><Trash2 size={16} /></Button>
                  <Button variant="default" size="sm" onClick={() => setParentForSub(main)} className="bg-accent hover:bg-accent/90 rounded-xl font-bold">
                    <PlusCircle size={16} className="ml-2" /> إضافة تخصص
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCategories?.filter(sub => sub.type === 'sub' && sub.parentId === main.id).map((sub) => (
                    <div key={sub.id} className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-lg flex items-center gap-2">
                          <Filter size={16} className="text-accent" /> {sub.name}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(sub.id)}><X size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => setParentForSub(sub)}><Plus size={14} /></Button>
                        </div>
                      </div>
                      
                      {/* الخيارات الدقيقة (المستوى 3) */}
                      <div className="flex flex-wrap gap-2">
                        {allCategories?.filter(opt => opt.type === 'option' && opt.parentId === sub.id).map((opt) => (
                          <Badge key={opt.id} variant="secondary" className="bg-white border-2 px-3 py-1 rounded-lg flex items-center gap-2">
                            {opt.name}
                            <button onClick={() => handleDelete(opt.id)} className="text-red-400 hover:text-red-600"><X size={10} /></button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* مودال الإضافة الفرعية السريع */}
      {parentForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black">إضافة عنصر جديد تحت <span className="text-primary">{parentForSub.name}</span></h3>
              <Button variant="ghost" onClick={() => setParentForSub(null)}><X /></Button>
            </div>
            <div className="space-y-4">
              <Label className="font-bold">الاسم الجديد</Label>
              <Input 
                autoFocus
                placeholder="اكتب هنا..." 
                className="h-14 rounded-xl border-2 text-lg font-bold"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd(parentForSub.type === 'main' ? 'sub' : 'option', parentForSub.id)}
              />
              <Button onClick={() => handleAdd(parentForSub.type === 'main' ? 'sub' : 'option', parentForSub.id)} className="w-full h-14 rounded-xl font-black text-lg">
                تأكيد الإضافة
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
