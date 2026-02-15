
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, ArrowRight, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "jobs"), where("status", "==", "active"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: jobs, isLoading } = useCollection(jobsQuery);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-16 mb-20" dir="rtl">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative py-10">
        <div className="absolute inset-0 bg-primary/5 rounded-[4rem] -z-10 blur-3xl"></div>
        <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-inner mb-6">
          <Briefcase size={48} />
        </div>
        <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tight text-zinc-900 leading-tight">
          انضم إلى <span className="text-primary">فريقنا</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-bold">
          نحن دائماً نبحث عن المواهب الاستثنائية التي ترغب في تغيير مستقبل التعليم العربي.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BenefitCard icon={Sparkles} title="بيئة عمل محفزة" desc="نحن نؤمن بالإبداع والابتكار في كل تفصيلة." />
        <BenefitCard icon={UserCheck} title="تمكين كامل" desc="نمنحك الثقة والأدوات اللازمة للنمو والنجاح." />
        <BenefitCard icon={Clock} title="مرونة عالية" desc="بيئة عمل تحترم وقتك وتوازن بين العمل والحياة." />
      </div>

      {/* Jobs Listing */}
      <div className="space-y-8">
        <div className="border-r-8 border-primary pr-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-zinc-800">الفرص المتاحة</h2>
            <p className="text-muted-foreground font-bold">تصفح الوظائف الحالية وتقدم للتي تناسبك.</p>
          </div>
          <Badge className="bg-primary/10 text-primary font-black px-4 py-1 border-none text-lg">
            {jobs?.length || 0} وظيفة
          </Badge>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="py-20 text-center animate-pulse font-black text-2xl">جاري تحميل الوظائف...</div>
          ) : jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <Card key={job.id} className="rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 transition-all shadow-lg hover:shadow-2xl overflow-hidden bg-white group">
                <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="space-y-4 text-right flex-1 w-full">
                    <div className="flex items-center gap-3 justify-end md:justify-start flex-wrap">
                      <Badge variant="secondary" className="font-bold bg-muted/50">{job.type === 'full-time' ? 'دوام كامل' : job.type === 'part-time' ? 'دوام جزئي' : 'عمل حر'}</Badge>
                      <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                        <Clock size={12}/> {new Date(job.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 group-hover:text-primary transition-colors">{job.title}</h3>
                    <p className="text-zinc-600 font-medium line-clamp-2 leading-relaxed">{job.description}</p>
                  </div>
                  <Button className="h-16 px-10 rounded-2xl font-black text-lg bg-zinc-900 hover:bg-primary transition-colors group-hover:scale-105 shadow-xl">
                    تفاصيل الوظيفة <ArrowRight className="mr-2 rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center bg-zinc-50 rounded-[3rem] border-4 border-dashed border-zinc-200">
              <p className="text-2xl font-black text-zinc-400">لا توجد وظائف شاغرة حالياً. تابعنا باستمرار!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border-2 shadow-sm text-center space-y-4">
      <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-primary">
        <Icon size={32} />
      </div>
      <h4 className="text-xl font-black">{title}</h4>
      <p className="text-muted-foreground font-bold text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
