
"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User, LogOut, Mail, GraduationCap, Layout, Search } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const lastNotifCount = useRef(0);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const systemNotifsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !mounted || profile?.status === 'blocked') return null;
    return query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [firestore, user, profile?.status, mounted]);

  const { data: systemNotifs } = useCollection(systemNotifsQuery);

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !mounted) return null;
    return query(
      collection(firestore, "direct_chats"),
      where("participants", "array-contains", user.uid),
      where("hasUnread", "==", true),
      where("lastSenderId", "!=", user.uid)
    );
  }, [firestore, user, mounted]);
  const { data: unreadChats } = useCollection(unreadMessagesQuery);

  const unreadSystemNotifs = systemNotifs?.filter(n => !n.read) || [];
  const totalNotifications = unreadSystemNotifs.length;
  const totalMessages = unreadChats?.length || 0;

  useEffect(() => {
    if (mounted && totalNotifications > lastNotifCount.current) {
      const latestNotif = systemNotifs?.[0];
      if (latestNotif) {
        toast({
          title: "إشعار جديد 🔔",
          description: latestNotif.title || latestNotif.message || "لديك تحديث جديد في المنصة.",
        });
      }
    }
    lastNotifCount.current = totalNotifications;
  }, [totalNotifications, systemNotifs, toast, mounted]);

  useEffect(() => {
    if (mounted && totalMessages > lastMessageCount.current) {
      toast({
        title: "رسالة جديدة 📩",
        description: "لديك رسالة توضيحية بانتظارك في مركز الرسائل.",
        onClick: () => router.push('/messages')
      });
    }
    lastMessageCount.current = totalMessages;
  }, [totalMessages, toast, router, mounted]);

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

  if (!mounted) return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-lg h-24 md:h-32" />
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex h-24 md:h-32 items-center justify-between px-4 md:px-10 max-w-[1920px] mx-auto gap-2">
        
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <SidebarTrigger className="h-12 w-12 md:h-20 md:w-20 text-primary shrink-0" />
          
          <nav className="flex items-center gap-1 md:gap-4 border-r-2 pr-2 md:pr-6 border-zinc-100 overflow-x-auto no-scrollbar py-2">
            <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
            <HeaderNavLink href="/portfolio" icon={Layout} label="الأعمال" />
            <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-8 mx-2 md:mx-6 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/messages')}
            className="relative h-14 w-14 md:h-24 md:w-24 rounded-2xl hover:bg-primary/5 text-muted-foreground transition-all group"
          >
            <Mail className="h-9 w-9 md:h-12 md:w-12 group-hover:scale-110 transition-transform text-zinc-600" />
            {totalMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex h-8 w-8 md:h-12 md:w-12">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 md:h-12 md:w-12 bg-accent border-4 border-white shadow-md flex items-center justify-center">
                   <span className="text-[10px] md:text-sm text-white font-black">{totalMessages}</span>
                </span>
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-14 w-14 md:h-24 md:w-24 rounded-2xl hover:bg-primary/5 text-muted-foreground transition-all group">
                <Bell className="h-9 w-9 md:h-12 md:w-12 group-hover:scale-110 transition-transform text-zinc-600" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-8 w-8 md:h-12 md:w-12">
                    <span className="relative inline-flex rounded-full h-8 w-8 md:h-12 md:w-12 bg-red-500 border-4 border-white shadow-md flex items-center justify-center">
                      <span className="text-[10px] md:text-sm text-white font-black">{totalNotifications}</span>
                    </span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[300px] md:w-[500px] p-4 rounded-[2.5rem] shadow-2xl border-4" dir="rtl">
              <div className="flex justify-between items-center p-4">
                <DropdownMenuLabel className="text-2xl md:text-3xl font-black p-0">التنبيهات</DropdownMenuLabel>
                {unreadSystemNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="text-md font-black text-primary hover:bg-primary/5">تحديد كقروء</Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[500px] overflow-y-auto p-2">
                {systemNotifs && systemNotifs.length > 0 ? (
                  systemNotifs.map((n: any) => (
                    <DropdownMenuItem key={n.id} className={`p-4 md:p-6 rounded-3xl cursor-pointer hover:bg-muted mb-2 transition-all ${!n.read ? 'bg-primary/5 border-r-4 border-primary' : 'border-r-4 border-transparent'}`}>
                      <div className="flex gap-4 text-right w-full">
                        <div className="bg-primary/10 p-3 rounded-2xl h-14 w-14 flex items-center justify-center shrink-0">
                          <Bell className="text-primary h-8 w-8" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="font-black text-lg leading-tight text-zinc-800">{n.title}</p>
                          <p className="text-sm text-muted-foreground font-bold leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-10 text-center text-muted-foreground font-bold opacity-50 italic">لا توجد تنبيهات</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center justify-center h-16 w-16 md:h-28 md:w-28 rounded-full md:rounded-[3rem] hover:bg-primary/5 group border-2 border-transparent transition-all p-0">
                  <Avatar className="h-12 w-12 md:h-20 md:w-20 border-[4px] border-primary/20 shadow-lg transition-transform group-hover:scale-110">
                    <AvatarImage src={profile?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 md:w-96 p-4 rounded-[2.5rem] shadow-2xl border-4" dir="rtl">
                <DropdownMenuLabel className="font-black p-4 text-right text-2xl border-b mb-2">
                  <div className="flex flex-col">
                    <span>{profile?.fullName}</span>
                    <span className="text-xs text-primary font-bold">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/profile')} className="p-5 rounded-[1.5rem] cursor-pointer flex justify-end gap-4 font-black text-xl hover:bg-primary/5 mb-1">
                  الملف الشخصي <User className="h-7 w-7 text-primary" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-5 rounded-[1.5rem] cursor-pointer flex justify-end gap-4 font-black text-xl hover:bg-primary/5 mb-1">
                  المحفظة <Layout className="h-7 w-7 text-accent" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="p-5 rounded-[1.5rem] cursor-pointer text-destructive focus:text-destructive flex justify-end gap-4 font-black text-xl hover:bg-red-50 mt-1">
                  تسجيل الخروج <LogOut className="h-7 w-7" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/login')} className="h-14 md:h-20 px-6 md:px-10 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-2xl shadow-xl">دخول</Button>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2 md:gap-4 px-3 md:px-6 py-2 md:py-4 rounded-xl md:rounded-3xl text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all font-black text-md md:text-xl whitespace-nowrap group shrink-0 border-2 border-transparent hover:border-primary/10"
    >
      <Icon className="h-6 w-6 md:h-10 md:w-10 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
