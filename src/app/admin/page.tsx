
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShieldCheck, 
  BadgeCent, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity
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
  Line
} from "recharts";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [stats, setStats] = useState({
    mufahems: 0,
    mustafhems: 0,
    pendingVerifications: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading]);

  // جلب إحصائيات سريعة
  useEffect(() => {
    const fetchStats = async () => {
      if (!firestore) return;
      const mufQuery = query(collection(firestore, "users"), where("role", "==", "mufhem"));
      const musQuery = query(collection(firestore, "users"), where("role", "==", "mustafhem"));
      const verQuery = query(collection(firestore, "verificationRequests"), where("status", "==", "pending"));
      
      const [mufSnap, musSnap, verSnap] = await Promise.all([
        getDocs(mufQuery),
        getDocs(musQuery),
        getDocs(verQuery)
      ]);

      setStats({
        mufahems: mufSnap.size,
        mustafhems: musSnap.size,
        pendingVerifications: verSnap.size,
        totalTransactions: 0, // محاكاة لسرعة العرض
        totalRevenue: 0
      });
    };
    fetchStats();
  }, [firestore]);

  const chartData = [
    { name: "السبت", users: 40, requests: 24 },
    { name: "الأحد", users: 30, requests: 13 },
    { name: "الاثنين", users: 20, requests: 98 },
    { name: "الثلاثاء", users: 27, requests: 39 },
    { name: "الأربعاء", users: 18, requests: 48 },
    { name: "الخميس", users: 23, requests: 38 },
    { name: "الجمعة", users: 34, requests: 43 },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-r-8 border-accent pr-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-headline">لوحة تحكم المسؤول</h1>
          <p className="text-muted-foreground text-lg">نظرة عامة على أداء المنصة والعمليات الحالية.</p>
        </div>
        <div className="flex items-center gap-3 bg-accent/10 px-6 py-3 rounded-2xl">
          <Activity className="text-accent animate-pulse" />
          <span className="font-bold text-accent">النظام يعمل بشكل مستقر</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="المفهمين" value={stats.mufahems} icon={Users} color="bg-blue-500" />
        <StatCard title="المستفهمين" value={stats.mustafhems} icon={Users} color="bg-green-500" />
        <StatCard title="طلبات توثيق" value={stats.pendingVerifications} icon={ShieldCheck} color="bg-orange-500" />
        <StatCard title="إجمالي الإيرادات" value="12,450 ج.م" icon={BadgeCent} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="shadow-xl rounded-[2.5rem] p-6">
          <CardHeader>
            <CardTitle className="font-black text-2xl flex items-center gap-3">
              <TrendingUp className="text-accent" /> نمو المستخدمين والطلبات
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                <Bar dataKey="requests" fill="hsl(var(--accent))" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-[2.5rem] p-6">
          <CardHeader>
            <CardTitle className="font-black text-2xl flex items-center gap-3">
              <Clock className="text-accent" /> نشاط السيرفر (Real-time)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--accent))" strokeWidth={4} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="shadow-lg border-2 border-transparent hover:border-accent/20 transition-all rounded-3xl overflow-hidden">
      <CardContent className="p-8 flex items-center gap-6">
        <div className={`${color} p-4 rounded-2xl shadow-lg shadow-black/10`}>
          <Icon className="text-white h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-black tabular-nums">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
