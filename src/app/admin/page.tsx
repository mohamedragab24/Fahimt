
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShieldCheck, 
  BadgeCent, 
  TrendingUp, 
  Clock, 
  Activity,
  ArrowUpRight,
  Wallet,
  Users2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const [stats, setStats] = useState({
    mufahems: 0,
    mustafhems: 0,
    pendingVerifications: 0,
    totalVolume: 0, // إجمالي المبالغ المتداولة
    platformRevenue: 0, // إيرادات التطبيق (العمولة)
    totalUsers: 0
  });

  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const isMasterAdmin = user?.email === "mohamed76y@gmail.com";
    if (!isProfileLoading && profile && !profile.isAdmin && !isMasterAdmin) {
      router.push("/");
    }
  }, [profile, isProfileLoading, router, user?.email]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!firestore) return;
      try {
        // 1. حساب أعداد المستخدمين
        const mufQuery = query(collection(firestore, "users"), where("role", "==", "mufhem"));
        const musQuery = query(collection(firestore, "users"), where("role", "==", "mustafhem"));
        const verQuery = query(collection(firestore, "verificationRequests"), where("status", "==", "pending"));
        
        // 2. حساب المبالغ من الطلبات المكتملة
        const completedRequestsQuery = query(collection(firestore, "requests"), where("status", "==", "completed"));
        
        // 3. جلب آخر الطلبات للجدول
        const lastRequestsQuery = query(collection(firestore, "requests"), orderBy("createdAt", "desc"), limit(5));

        const [mufSnap, musSnap, verSnap, completedSnap, lastSnap] = await Promise.all([
          getDocs(mufQuery),
          getDocs(musQuery),
          getDocs(verQuery),
          getDocs(completedRequestsQuery),
          getDocs(lastRequestsQuery)
        ]);

        let totalVolume = 0;
        completedSnap.forEach(doc => {
          totalVolume += (doc.data().amount || 0);
        });

        // افترضنا عمولة التطبيق 20% كما في كود المعاملات
        const platformRevenue = totalVolume * 0.2;

        setStats({
          mufahems: mufSnap.size,
          mustafhems: musSnap.size,
          pendingVerifications: verSnap.size,
          totalVolume: totalVolume,
          platformRevenue: platformRevenue,
          totalUsers: mufSnap.size + musSnap.size
        });

        setRecentRequests(lastSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      } catch (e) {
        console.error("Error fetching admin stats:", e);
      }
    };
    fetchStats();
  }, [firestore]);

  if (isUserLoading || isProfileLoading) return <div className="p-10 text-center font-bold animate-pulse">جاري التحقق من صلاحيات المسؤول...</div>;
  
  const isMasterAdmin = user?.email === "mohamed76y@gmail.com";
  if (!profile?.isAdmin && !isMasterAdmin) return null;

  const chartData = [
    { name: "إجمالي التداول", value: stats.totalVolume, color: "hsl(var(--primary))" },
    { name: "إيرادات المنصة", value: stats.platformRevenue, color: "hsl(var(--accent))" },
    { name: "أرباح المفهمين", value: stats.totalVolume - stats.platformRevenue, color: "#10b981" },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-primary pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">نظرة عامة على النظام</h1>
          <p className="text-muted-foreground text-lg">تحليل شامل للإحصائيات، المستخدمين، والإيرادات المالية الحقيقية.</p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-2xl">
          <Activity className="text-primary animate-pulse" />
          <span className="font-bold text-primary">النظام يعمل بكفاءة عالية</span>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={Users2} color="bg-blue-500" />
        <StatCard title="طلبات توثيق" value={stats.pendingVerifications} icon={ShieldCheck} color="bg-orange-500" />
        <StatCard title="إجمالي المبالغ المتداولة" value={`${stats.totalVolume.toLocaleString()} ج.م`} icon={Wallet} color="bg-purple-600" />
        <StatCard title="صافي إيرادات التطبيق" value={`${stats.platformRevenue.toLocaleString()} ج.م`} icon={BadgeCent} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* رسم بياني لتوزيع المبالغ */}
        <Card className="shadow-2xl rounded-[2.5rem] border-2 p-6 bg-white">
          <CardHeader>
            <CardTitle className="font-black text-2xl flex items-center gap-3">
              <TrendingUp className="text-primary" /> توزيع الإيرادات والسيولة
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ right: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'المبلغ']}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* قائمة آخر العمليات */}
        <Card className="shadow-2xl rounded-[2.5rem] border-2 overflow-hidden bg-white">
          <CardHeader className="bg-muted/30 border-b p-6">
            <CardTitle className="font-black text-xl flex items-center gap-3">
              <Clock className="text-primary" /> آخر الطلبات المنفذة
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-muted/10 h-12">
              <TableRow>
                <TableHead className="text-right font-bold">الطلب</TableHead>
                <TableHead className="text-right font-bold">المبلغ</TableHead>
                <TableHead className="text-right font-bold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((req) => (
                <TableRow key={req.id} className="h-16 hover:bg-muted/5">
                  <TableCell className="font-bold text-sm">
                    <div className="flex flex-col">
                      <span>{req.title}</span>
                      <span className="text-[10px] text-muted-foreground">{req.studentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-primary">{req.amount} ج.م</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {req.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {recentRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">لا توجد طلبات مسجلة بعد.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* قسم تفصيلي لإيرادات المفهمين */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black border-r-8 border-accent pr-6">قائمة إيرادات المنصة والمفهمين</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-[2rem] border-2 shadow-lg p-8 bg-zinc-900 text-white">
            <div className="flex justify-between items-center mb-6">
              <div className="bg-primary/20 p-4 rounded-2xl">
                <BadgeCent className="h-8 w-8 text-primary" />
              </div>
              <ArrowUpRight className="text-green-500 h-8 w-8" />
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400 font-bold">إجمالي سيولة المنصة</p>
              <h2 className="text-5xl font-black tabular-nums">{stats.totalVolume.toLocaleString()} <span className="text-lg">ج.م</span></h2>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500">منصة (20%)</p>
                <p className="text-xl font-bold">{stats.platformRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">مفهمين (80%)</p>
                <p className="text-xl font-bold">{(stats.totalVolume - stats.platformRevenue).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-2 shadow-lg p-8 bg-white flex flex-col justify-center gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">توزع القوى العاملة</p>
                <p className="text-2xl font-black">المفهمين: {stats.mufahems} | المستفهمين: {stats.mustafhems}</p>
              </div>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-500 h-full transition-all duration-1000" 
                style={{ width: `${(stats.mufahems / stats.totalUsers) * 100}%` }}
              ></div>
              <div 
                className="bg-green-500 h-full transition-all duration-1000" 
                style={{ width: `${(stats.mustafhems / stats.totalUsers) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-center font-bold text-muted-foreground">
              نسبة المفهمين للمستفهمين هي {Math.round((stats.mufahems / (stats.mustafhems || 1)) * 100)}%
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="shadow-lg border-2 border-transparent hover:border-primary/20 transition-all rounded-[2rem] overflow-hidden bg-white">
      <CardContent className="p-8 flex items-center gap-6">
        <div className={`${color} p-4 rounded-2xl shadow-lg shadow-black/10`}>
          <Icon className="text-white h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground">{title}</p>
          <h3 className="text-2xl md:text-3xl font-black tabular-nums">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
