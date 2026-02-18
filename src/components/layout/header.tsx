
"use client";

import { useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Video, User, Settings, LogOut, ShieldCheck, Mail, GraduationCap, Layout, Search, CheckCircle2 } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, limit, orderBy, writeBatch } from "firebase/firestore";
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

  // استعلام للرسائل غير المقروءة (مثال مبسط)
  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "direct_chats"),
      where("participants", "array-contains", user.uid),
      where("hasUnread", "==", true),
      where("lastSenderId", "!=", user.uid)
    );
  }, [firestore, user]);
  const { data: unreadChats } = useCollection(unreadMessagesQuery);

  const unreadSystemNotifs = systemNotifs?.filter(n => !n.read) || [];
  const totalNotifications = unreadSystemNotifs.length;

  useEffect(() => {
    if (totalNotifications > lastNotifCount.current) {
      const latestNotif = systemNotifs?.[0];
      if (latestNotif) {
        toast({
          title: "إشعار جديد 🔔",
          description: latestNotif.title || latestNotif.message || "لديك تحديث جديد في المنصة.",
        });
      }
    }
    lastNotifCount.current = totalNotifications;
  }, [totalNotifications, systemNotifs, toast]);

  const markAllRead = async () => {
    if (!firestore || !user || unreadSystemNotifs.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      unreadSystemNotifs.forEach(notif => {
        batch.update(doc(firestore, "notifications", notif.id), { read: true });
      });
      await batch.commit();
      toast({ title: "تم تحديث كافة التنبيهات" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  const verifiedBadgeUrl = PlaceHolderImages.find(img => img.id === 'verified-badge')?.imageUrl;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-20 items-center justify-between px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 text-primary" />
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white/20">
              {settings?.miniIconUrl ? (
                <img src={settings.miniIconUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-lg">ف</span>
              )}
            </div>
            <span className="font-black text-2xl hidden lg:block text-primary">{settings?.siteTitle || "فهمني"}</span>
          </Link>

          {/* روابط التنقل الثابتة */}
          <nav className="hidden md:flex items-center gap-1 mr-6 border-r pr-6 border-zinc-100">
            <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
            <HeaderNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
            <HeaderNavLink href="/browse" icon={Search} label="تصفح الاستفهامات" />
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* أيقونة الرسائل */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/messages')}
            className="relative h-11 w-11 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all"
          >
            <Mail className="h-6 w-6" />
            {unreadChats && unreadChats.length > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
            )}
          </Button>

          {/* أيقونة التنبيهات */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all">
                <Bell className="h-6 w-6" />
                {totalNotifications > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <div className="flex justify-between items-center p-3">
                <DropdownMenuLabel className="text-lg font-black p-0">التنبيهات</DropdownMenuLabel>
                {unreadSystemNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs font-bold text-primary h-8">تحديد كقروء</Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {systemNotifs && systemNotifs.length > 0 ? (
                  systemNotifs.map((n: any) => (
                    <DropdownMenuItem key={n.id} className={`p-4 rounded-xl cursor-pointer hover:bg-muted mb-1 ${!n.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex gap-3 text-right w-full">
                        <div className="bg-primary/10 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                          <Bell className="text-primary h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-sm leading-tight">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground">{n.message}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm font-bold opacity-50 italic">لا توجد تنبيهات جديدة</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* بروفايل المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-12 pr-1 pl-3 rounded-2xl hover:bg-primary/5 group border border-transparent hover:border-zinc-100 transition-all">
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black leading-none">{profile?.fullName || "..."}</span>
                    {profile?.isVerified && verifiedBadgeUrl && <img src={verifiedBadgeUrl} alt="V" className="h-3 w-3" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold mt-1">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <DropdownMenuLabel className="font-black p-3 text-right">حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="p-3 rounded-xl cursor-pointer flex justify-end gap-3 font-bold">
                الملف الشخصي <User className="h-4 w-4 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-3 rounded-xl cursor-pointer flex justify-end gap-3 font-bold">
                المحفظة <Settings className="h-4 w-4 text-accent" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive flex justify-end gap-3 font-bold">
                خروج <LogOut className="h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function HeaderNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all font-black text-sm whitespace-nowrap"
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}
