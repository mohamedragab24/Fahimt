
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

  // استعلام للرسائل غير المقروءة
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex h-28 items-center justify-between px-4 md:px-12 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-8">
          <SidebarTrigger className="h-14 w-14 text-primary scale-125" />
          <Link href="/" className="flex items-center gap-4 group shrink-0">
            <div className="bg-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden border-2 border-white/20">
              {settings?.miniIconUrl ? (
                <img src={settings.miniIconUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-3xl">ف</span>
              )}
            </div>
            <span className="font-black text-4xl hidden xl:block text-primary tracking-tighter transition-colors group-hover:text-primary/80">{settings?.siteTitle || "فهمني"}</span>
          </Link>

          {/* روابط التنقل الثابتة - حجم أكبر وبنط عريض */}
          <nav className="hidden md:flex items-center gap-4 mr-10 border-r-4 pr-10 border-zinc-100">
            <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
            <HeaderNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
            <HeaderNavLink href="/browse" icon={Search} label="تصفح الاستفهامات" />
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          {/* أيقونة الرسائل - تصميم بارز */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/messages')}
            className="relative h-16 w-16 rounded-2xl hover:bg-primary/5 text-muted-foreground transition-all group border-2 border-transparent hover:border-primary/10"
          >
            <Mail className="h-9 w-9 group-hover:scale-110 transition-transform" />
            {unreadChats && unreadChats.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-8 w-8">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-accent border-4 border-white shadow-md flex items-center justify-center">
                   <span className="text-[13px] text-white font-black">{unreadChats.length}</span>
                </span>
              </span>
            )}
          </Button>

          {/* أيقونة التنبيهات */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-16 w-16 rounded-2xl hover:bg-primary/5 text-muted-foreground transition-all group border-2 border-transparent hover:border-primary/10">
                <Bell className="h-9 w-9 group-hover:scale-110 transition-transform" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-8 w-8">
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-red-500 border-4 border-white shadow-md flex items-center justify-center">
                      <span className="text-[13px] text-white font-black">{totalNotifications}</span>
                    </span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[450px] p-3 rounded-[2.5rem] shadow-2xl border-4" dir="rtl">
              <div className="flex justify-between items-center p-5">
                <DropdownMenuLabel className="text-2xl font-black p-0">التنبيهات</DropdownMenuLabel>
                {unreadSystemNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="text-md font-black text-primary hover:bg-primary/5">تحديد كقروء</Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[600px] overflow-y-auto p-2">
                {systemNotifs && systemNotifs.length > 0 ? (
                  systemNotifs.map((n: any) => (
                    <DropdownMenuItem key={n.id} className={`p-6 rounded-3xl cursor-pointer hover:bg-muted mb-3 transition-all ${!n.read ? 'bg-primary/5 border-r-4 border-primary' : 'border-r-4 border-transparent'}`}>
                      <div className="flex gap-5 text-right w-full">
                        <div className="bg-primary/10 p-4 rounded-2xl h-14 w-14 flex items-center justify-center shrink-0">
                          <Bell className="text-primary h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-lg leading-tight text-zinc-800">{n.title}</p>
                          <p className="text-sm text-muted-foreground font-bold leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-16 text-center text-muted-foreground text-lg font-bold opacity-50 italic">لا توجد تنبيهات جديدة</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* بروفايل المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-5 h-20 pr-2 pl-6 rounded-[2rem] hover:bg-primary/5 group border-2 border-transparent hover:border-zinc-100 transition-all shadow-sm">
                <Avatar className="h-14 w-14 border-4 border-primary/20 shadow-lg transition-transform group-hover:scale-105">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black leading-none text-zinc-900">{profile?.fullName || "..."}</span>
                    {profile?.isVerified && verifiedBadgeUrl && <img src={verifiedBadgeUrl} alt="V" className="h-6 w-6" />}
                  </div>
                  <span className="text-[13px] text-primary font-black mt-1.5 uppercase tracking-widest">{profile?.role === 'mufhem' ? 'مُفهم معتمد' : 'مُستفهم طموح'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-4 rounded-[2.5rem] shadow-2xl border-4" dir="rtl">
              <DropdownMenuLabel className="font-black p-4 text-right text-xl border-b mb-2">حسابي</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push('/profile')} className="p-5 rounded-2xl cursor-pointer flex justify-end gap-5 font-black text-lg hover:bg-primary/5 mb-1">
                الملف الشخصي <User className="h-7 w-7 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-5 rounded-2xl cursor-pointer flex justify-end gap-5 font-black text-lg hover:bg-primary/5 mb-1">
                المحفظة <Settings className="h-7 w-7 text-accent" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="p-5 rounded-2xl cursor-pointer text-destructive focus:text-destructive flex justify-end gap-5 font-black text-lg hover:bg-red-50 mt-1">
                تسجيل الخروج <LogOut className="h-7 w-7" />
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
      className="flex items-center gap-4 px-6 py-4 rounded-2xl text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all font-black text-xl whitespace-nowrap group"
    >
      <Icon size={28} className="group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
