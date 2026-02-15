
"use client";

import { useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Video, User, Settings, LogOut, ShieldCheck, LifeBuoy, CheckCircle2, XCircle } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Header() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const lastNotifCount = useRef(0);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "general");
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  // إشعارات الاستفهامات المقبولة
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile?.role || profile?.status === 'blocked') return null;
    const istifhamsRef = collection(firestore, "istifhams");
    const field = profile?.role === "mufhem" ? "mufhemId" : "mustafhemId";
    return query(
      istifhamsRef,
      where(field, "==", user.uid),
      where("status", "==", "accepted"),
      limit(5)
    );
  }, [firestore, user, profile?.role, profile?.status]);

  const { data: acceptedRequests } = useCollection(notificationsQuery);

  // إشعارات النظام
  const systemNotifsQuery = useMemoFirebase(() => {
    if (!firestore || !user || profile?.status === 'blocked') return null;
    return query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [firestore, user, profile?.status]);

  const { data: systemNotifs } = useCollection(systemNotifsQuery);

  const totalNotifications = (acceptedRequests?.length || 0) + (systemNotifs?.filter(n => !n.read).length || 0);

  // عرض تنبيه منبثق عند وصول إشعار جديد
  useEffect(() => {
    if (totalNotifications > lastNotifCount.current) {
      const latestNotif = systemNotifs?.[0] || acceptedRequests?.[0];
      if (latestNotif) {
        toast({
          title: "إشعار جديد 🔔",
          description: latestNotif.title || latestNotif.message || "لديك تحديث جديد في المنصة.",
        });
      }
    }
    lastNotifCount.current = totalNotifications;
  }, [totalNotifications, systemNotifs, acceptedRequests, toast]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  const verifiedBadgeUrl = PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-24 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-12 w-12 text-primary" />
          <Link href="/" className="flex items-center gap-2 mr-2 group">
            {settings?.miniIconUrl ? (
              <div className="relative group-hover:scale-110 transition-transform">
                <img src={settings.miniIconUrl} alt="Logo" className="h-12 w-12 md:h-14 md:h-14 rounded-xl object-contain shadow-md" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></div>
              </div>
            ) : (
              <div className="relative bg-primary p-2 rounded-xl shadow-md transition-transform group-hover:scale-110">
                <span className="text-white font-black text-xl">ف</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></div>
              </div>
            )}
            {!settings?.logoUrl && <span className="font-black text-3xl font-headline hidden sm:inline-block text-primary">فهمني</span>}
            {settings?.logoUrl && <img src={settings.logoUrl} alt="Full Logo" className="h-16 w-auto hidden sm:inline-block object-contain" />}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full hover:bg-primary/5 text-muted-foreground transition-all">
                <Bell className="h-7 w-7" />
                {totalNotifications > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <DropdownMenuLabel className="text-lg font-black p-3 text-right">مركز الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {totalNotifications > 0 ? (
                  <>
                    {systemNotifs?.map((n: any) => (
                      <DropdownMenuItem 
                        key={n.id} 
                        className="p-4 rounded-xl cursor-pointer hover:bg-muted border-b last:border-0"
                      >
                        <div className="flex gap-4">
                          <div className={`p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0 ${n.type === 'approval' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                            {n.type === 'approval' ? <CheckCircle2 size={24} /> : <Bell size={24} />}
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-sm leading-tight text-right">{n.title}</p>
                            <p className="text-[10px] text-muted-foreground text-right">{n.message}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {acceptedRequests?.map((req: any) => (
                      <DropdownMenuItem 
                        key={req.id} 
                        className="p-4 rounded-xl cursor-pointer hover:bg-primary/5 border-b last:border-0"
                        onClick={() => router.push(`/meeting/${req.id}`)}
                      >
                        <div className="flex gap-4">
                          <div className={`bg-primary/10 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0`}>
                            <Video className="text-primary h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-sm leading-tight text-right">محاضرة بانتظارك: {req.title}</p>
                            <p className="text-[10px] text-muted-foreground text-right">اضغط لدخول البث الآن</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm font-bold">
                    لا توجد إشعارات جديدة حالياً
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <Button variant="ghost" onClick={() => router.push('/requests')} className="w-full font-black text-primary hover:text-primary py-2 text-sm">عرض كل الاستفهامات</Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-14 px-2 rounded-2xl hover:bg-primary/5 group">
                <div className="hidden md:flex flex-col text-left items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black leading-none group-hover:text-primary transition-colors">{profile?.fullName || "جاري التحميل..."}</span>
                    {profile?.role === 'mufhem' && profile?.isVerified && (
                      <img src={verifiedBadgeUrl} alt="Verified" className="h-3 w-3" data-ai-hint="verified badge" />
                    )}
                  </div>
                  <span className="text-[10px] text-accent font-black mt-1 uppercase tracking-tighter">
                    {profile?.role === "mufhem" ? "مُفهم معتمد" : "مُستفهم طموح"}
                  </span>
                </div>
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black">
                    {profile?.fullName?.charAt(0) || "ف"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <DropdownMenuLabel className="font-black p-3 text-right">حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="p-3 rounded-xl cursor-pointer flex justify-end">
                <span className="font-black">الملف الشخصي</span>
                <User className="mr-2 h-4 w-4 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-3 rounded-xl cursor-pointer flex justify-end">
                <span className="font-black">المحفظة</span>
                <Settings className="mr-2 h-4 w-4 text-accent" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive flex justify-end">
                <span className="font-black">تسجيل الخروج</span>
                <LogOut className="mr-2 h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
