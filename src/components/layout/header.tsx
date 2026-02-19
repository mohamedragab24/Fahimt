
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
  const lastMessageCount = useRef(0);

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
  const totalMessages = unreadChats?.length || 0;

  // تنبيهات الإشعارات
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

  // تنبيهات الرسائل الجديدة
  useEffect(() => {
    if (totalMessages > lastMessageCount.current) {
      toast({
        title: "رسالة جديدة 📩",
        description: "لديك رسالة توضيحية بانتظارك في مركز الرسائل.",
        onClick: () => router.push('/messages')
      });
    }
    lastMessageCount.current = totalMessages;
  }, [totalMessages, toast, router]);

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
      <div className="flex h-28 md:h-32 items-center justify-between px-4 md:px-12 max-w-[1920px] mx-auto overflow-hidden">
        <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
          <SidebarTrigger className="h-14 w-14 md:h-16 md:w-16 text-primary shrink-0" />
          
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="bg-primary w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden border-2 border-white/20 transition-transform group-hover:scale-105">
              {settings?.miniIconUrl ? (
                <img src={settings.miniIconUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-4xl">ف</span>
              )}
            </div>
            <span className="font-black text-3xl md:text-5xl hidden xl:block text-primary tracking-tighter transition-colors group-hover:text-primary/80">{settings?.siteTitle || "فهمني"}</span>
          </Link>

          <nav className="flex items-center gap-3 md:gap-6 mr-4 md:mr-12 border-r-4 pr-4 md:pr-12 border-zinc-100 overflow-x-auto no-scrollbar flex-nowrap py-4">
            <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
            <HeaderNavLink href="/portfolio" icon={Layout} label="الأعمال" />
            <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-10 shrink-0 mr-4">
          {/* أيقونة الرسائل */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/messages')}
            className="relative h-16 w-16 md:h-24 md:w-24 rounded-2xl hover:bg-primary/5 text-muted-foreground transition-all group border-2 border-transparent hover:border-primary/10"
          >
            <Mail className="h-10 w-10 md:h-12 md:w-12 group-hover:scale-110 transition-transform text-zinc-600" />
            {totalMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex h-8 w-8 md:h-11 md:w-11">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 md:h-11 md:w-11 bg-accent border-4 border-white shadow-md flex items-center justify-center">
                   <span className="text-xs md:text-lg text-white font-black">{totalMessages}</span>
                </span>
              </span>
            )}
          </Button>

          {/* أيقونة التنبيهات */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-16 w-16 md:h-24 md:w-24 rounded-2xl hover:bg-primary/5 text-muted-foreground transition-all group border-2 border-transparent hover:border-primary/10">
                <Bell className="h-10 w-10 md:h-12 md:w-12 group-hover:scale-110 transition-transform text-zinc-600" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-8 w-8 md:h-11 md:w-11">
                    <span className="relative inline-flex rounded-full h-8 w-8 md:h-11 md:w-11 bg-red-500 border-4 border-white shadow-md flex items-center justify-center">
                      <span className="text-xs md:text-lg text-white font-black">{totalNotifications}</span>
                    </span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] md:w-[500px] p-4 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-4" dir="rtl">
              <div className="flex justify-between items-center p-5">
                <DropdownMenuLabel className="text-2xl md:text-3xl font-black p-0">التنبيهات</DropdownMenuLabel>
                {unreadSystemNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="text-md md:text-lg font-black text-primary hover:bg-primary/5">تحديد كقروء</Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[600px] overflow-y-auto p-2">
                {systemNotifs && systemNotifs.length > 0 ? (
                  systemNotifs.map((n: any) => (
                    <DropdownMenuItem key={n.id} className={`p-5 md:p-8 rounded-3xl cursor-pointer hover:bg-muted mb-3 transition-all ${!n.read ? 'bg-primary/5 border-r-8 border-primary' : 'border-r-8 border-transparent'}`}>
                      <div className="flex gap-5 md:gap-6 text-right w-full">
                        <div className="bg-primary/10 p-4 md:p-5 rounded-2xl md:rounded-[2rem] h-14 w-14 md:h-20 md:w-20 flex items-center justify-center shrink-0">
                          <Bell className="text-primary h-8 w-8 md:h-10 md:w-10" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <p className="font-black text-lg md:text-2xl leading-tight text-zinc-800">{n.title}</p>
                          <p className="text-sm md:text-lg text-muted-foreground font-bold leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-16 text-center text-muted-foreground text-xl font-bold opacity-50 italic">لا توجد تنبيهات</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* بروفايل المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-4 md:gap-6 h-20 md:h-28 pr-2 md:pr-3 pl-4 md:pl-10 rounded-2xl md:rounded-[3rem] hover:bg-primary/5 group border-2 border-transparent hover:border-zinc-100 transition-all">
                <Avatar className="h-14 w-14 md:h-20 md:w-20 border-[6px] border-primary/20 shadow-xl transition-transform group-hover:scale-110">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-right">
                  <div className="flex items-center gap-3">
                    <span className="text-xl md:text-2xl font-black text-zinc-900">{profile?.fullName?.split(' ')[0]}</span>
                    {profile?.isVerified && verifiedBadgeUrl && <img src={verifiedBadgeUrl} alt="V" className="h-6 w-6" />}
                  </div>
                  <span className="text-xs md:text-sm text-primary font-black uppercase tracking-widest">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96 p-6 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-4" dir="rtl">
              <DropdownMenuLabel className="font-black p-6 text-right text-2xl border-b mb-4">حسابي الشخصي</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push('/profile')} className="p-6 rounded-[1.5rem] cursor-pointer flex justify-end gap-6 font-black text-xl hover:bg-primary/5 mb-2">
                الملف الشخصي <User className="h-8 w-8 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-6 rounded-[1.5rem] cursor-pointer flex justify-end gap-6 font-black text-xl hover:bg-primary/5 mb-2">
                المحفظة <Settings className="h-8 w-8 text-accent" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="p-6 rounded-[1.5rem] cursor-pointer text-destructive focus:text-destructive flex justify-end gap-6 font-black text-xl hover:bg-red-50 mt-2">
                تسجيل الخروج <LogOut className="h-8 w-8" />
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
      className="flex items-center gap-3 md:gap-5 px-4 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all font-black text-md md:text-2xl whitespace-nowrap group shrink-0 border-2 border-transparent hover:border-primary/10"
    >
      <Icon size={24} className="md:h-10 md:w-10 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
