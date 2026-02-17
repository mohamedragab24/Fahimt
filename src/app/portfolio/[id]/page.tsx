
"use client";

import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { 
  Star, 
  Clock, 
  Eye, 
  Share2, 
  ChevronRight, 
  MessageSquare, 
  PlayCircle, 
  Layout, 
  User, 
  Send, 
  Tag, 
  Heart,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Layers,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function PortfolioItemDetails() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const workRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "portfolio", id as string);
  }, [firestore, id]);

  const { data: work, isLoading: isWorkLoading } = useDoc(workRef);

  const teacherRef = useMemoFirebase(() => {
    if (!firestore || !work?.mufhemId) return null;
    return doc(firestore, "users", work.mufhemId);
  }, [firestore, work?.mufhemId]);

  const { data: teacher } = useDoc(teacherRef);

  // جلب أعمال مقترحة (بنفس القسم)
  const relatedQuery = useMemoFirebase(() => {
    if (!firestore || !work?.category || !id) return null;
    return query(
      collection(firestore, "portfolio"),
      where("category", "==", work.category),
      where("status", "==", "approved"),
      limit(4) // 4 ليشمل الحالي ثم نفلتره
    );
  }, [firestore, work?.category, id]);

  const { data: relatedRaw } = useCollection(relatedQuery);
  const relatedWorks = relatedRaw?.filter(w => w.id !== id).slice(0, 3) || [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: "تم نسخ الرابط" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isWorkLoading) return <div className="p-20 text-center animate-pulse font-black text-2xl">جاري تحميل تفاصيل العمل...</div>;
  if (!work) return <div className="p-20 text-center font-bold text-red-500">هذا العمل غير متاح حالياً.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* Navigation Breadcrumb */}
        <Button 
          variant="ghost" 
          onClick={() => router.push('/portfolio')}
          className="mb-8 hover:bg-white gap-2 font-bold text-zinc-500"
        >
          <ChevronRight size={18} className="rotate-180" />
          العودة لمعرض الأعمال
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content (Right Side) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
              <div className="p-10 space-y-8">
                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight">
                  {work.title}
                </h1>

                {/* Video Player Section */}
                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl relative group">
                  {work.mediaType === 'video' ? (
                    <video 
                      src={work.mediaUrl} 
                      className="w-full h-full" 
                      controls 
                      poster={work.thumbnailUrl}
                    />
                  ) : (
                    <img src={work.mediaUrl} className="w-full h-full object-contain" alt={work.title} />
                  )}
                </div>

                {/* Category & Tags */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-4 py-2 rounded-xl font-black flex items-center gap-2">
                    <Layers size={16} /> {work.category || "تخصص تعليمي"}
                  </Badge>
                  {work.categorySub && (
                    <Badge variant="outline" className="border-zinc-200 text-zinc-500 px-4 py-2 rounded-xl font-bold">
                      {work.categorySub}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-zinc-800 flex items-center gap-2">
                    <FileText size={20} className="text-primary" /> وصف العمل
                  </h3>
                  <div className="text-lg text-zinc-600 leading-relaxed font-medium bg-zinc-50/50 p-8 rounded-[2rem] border-2 border-dashed">
                    {work.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Works */}
            <div className="space-y-6 pt-10">
              <h3 className="text-2xl font-black text-zinc-800 border-r-8 border-primary pr-4 flex items-center gap-3">
                <Zap className="text-accent" /> أعمال قد تهمك
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedWorks.map((rw) => (
                  <Card 
                    key={rw.id} 
                    className="rounded-[2rem] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white"
                    onClick={() => router.push(`/portfolio/${rw.id}`)}
                  >
                    <div className="aspect-square relative bg-zinc-100 overflow-hidden">
                      <img src={rw.mediaUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={rw.title} />
                      {rw.mediaType === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle className="text-white h-10 w-10" /></div>}
                    </div>
                    <CardContent className="p-4 text-right">
                      <h4 className="font-black text-sm text-zinc-800 line-clamp-2 leading-snug">{rw.title}</h4>
                    </CardContent>
                  </Card>
                ))}
                {relatedWorks.length === 0 && <p className="text-muted-foreground font-bold italic py-10">لا توجد أعمال مقترحة حالياً لهذا التخصص.</p>}
              </div>
            </div>
          </div>

          {/* Sidebar (Left Side) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            
            {/* Work Card Card (بطاقة العمل) */}
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-6 border-b bg-zinc-50/50">
                <h4 className="font-black text-lg text-zinc-800">بطاقة العمل</h4>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <StatRow label="تقييم المستقل" value={
                    <div className="flex gap-0.5"><Star size={14} className="fill-yellow-400 text-yellow-400" /> <Star size={14} className="fill-yellow-400 text-yellow-400" /> <Star size={14} className="fill-yellow-400 text-yellow-400" /> <Star size={14} className="fill-yellow-400 text-yellow-400" /> <Star size={14} className="fill-yellow-400 text-yellow-400" /></div>
                  } />
                  <StatRow label="تاريخ النشر" value={`منذ ${getTimeAgo(work.createdAt)}`} />
                  <StatRow label="المشاهدات" value={work.views || "941"} />
                  <StatRow label="الإعجابات" value={work.likes || "12"} />
                  <StatRow label="القسم" value={<span className="text-primary font-black text-xs underline cursor-pointer">{work.category}</span>} />
                </div>

                <div className="pt-6 border-t border-dashed space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-zinc-400 text-[10px] font-black uppercase">المستقل</p>
                      <h5 className="font-black text-lg leading-tight">{teacher?.fullName}</h5>
                      <p className="text-[10px] text-muted-foreground font-bold mt-1">مفهم تعليمي</p>
                    </div>
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                      <AvatarImage src={teacher?.profilePictureUrl} />
                      <AvatarFallback>{teacher?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <Button 
                    onClick={() => router.push(`/?ask=${teacher?.id}`)}
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-primary text-primary font-black text-sm hover:bg-primary/5 gap-2"
                  >
                    <Send size={16} className="rotate-180" /> وظفني
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA Button (طلب عمل مماثل) */}
            <Button 
              onClick={() => router.push('/')}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all gap-3"
            >
              <Send size={24} className="rotate-180" /> طلب عمل مماثل
            </Button>

            {/* Skills Card */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b bg-zinc-50/50">
                <h4 className="font-black text-lg text-zinc-800">مهارات العمل</h4>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 justify-end">
                  {work.skills?.map((skill: string) => (
                    <Badge key={skill} className="bg-blue-500 text-white border-none px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5">
                      <Tag size={10} /> {skill}
                    </Badge>
                  )) || <p className="text-xs text-muted-foreground italic">لم يتم إدراج مهارات.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Share Card */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b bg-zinc-50/50">
                <h4 className="font-black text-lg text-zinc-800 text-right">شارك</h4>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-center gap-3">
                  <ShareBtn icon={Facebook} />
                  <ShareBtn icon={Twitter} />
                  <ShareBtn icon={Linkedin} />
                  <ShareBtn icon={MessageSquare} className="text-green-500" />
                  <button onClick={handleCopyLink} className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
                    {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} className="text-zinc-400" />}
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-zinc-500">{label}</span>
      <span className="text-sm font-black text-zinc-800">{value}</span>
    </div>
  );
}

function ShareBtn({ icon: Icon, className }: any) {
  return (
    <button className={`h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors ${className}`}>
      <Icon size={18} className="text-zinc-400" />
    </button>
  );
}

function getTimeAgo(dateStr: string) {
  if (!dateStr) return "لحظات";
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} شهر`;
  if (days > 0) return `${days} يوم`;
  return "ساعات";
}
