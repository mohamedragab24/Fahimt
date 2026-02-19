
"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User, LogOut, Mail, GraduationCap, Layout, Search } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import Link from "next/link";

/**
 * ترويسة الموقع المطورة - رشيقة ومنظمة لتناسب كافة الأجهزة (PC, Tablet, Mobile).
 */
export function Header() {
  const [mounted, setMounted] = useState(false);
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();

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
    if (!firestore || !user || !mounted) return null;
    return query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [firestore, user, mounted]);

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

  const totalNotifications = systemNotifs?.filter(n => !n.read).length || 0;
  const totalMessages = unreadChats?.length || 0;

  if (!mounted) return (
    <header className="sticky top-0 z-40 w-full border-b bg-background h-16 md:h-20" />
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm">
      <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-8 max-w-[1920px] mx-auto gap-2">
        
        {/* اليمين: القائمة والروابط الأساسية */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <SidebarTrigger className="h-9 w-9 md:h-11 md:w-11 text-primary shrink-0" />
          
          <nav className="flex items-center gap-1 md:gap-3 border-r pr-2 md:pr-4 border-zinc-100 overflow-x-auto no-scrollbar py-1">
            <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
            <HeaderNavLink href="/portfolio" icon={Layout} label="الأعمال" />
            <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
          </nav>
        </div>

        {/* المنتصف: الرسائل والتنبيهات - أحجام رشيقة */}
        <div className="flex items-center gap-2 md:gap-4 mx-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/messages')}
            className="relative h-9 w-9 md:h-11 md:w-11 rounded-xl hover:bg-primary/5 transition-all"
          >
            <Mail className="h-5 w-5 md:h-6 md:u-6 text-zinc-600" />
            {totalMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 md:h-6 md:w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 md:h-6 md:w-6 bg-accent border-2 border-white shadow-sm flex items-center justify-center">
                   <span className="text-[8px] md:text-[10px] text-white font-black">{totalMessages}</span>
                </span>
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-11 md:w-11 rounded-xl hover:bg-primary/5 transition-all">
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-zinc-600" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 md:h-6 md:w-6">
                    <span className="relative inline-flex rounded-full h-5 w-5 md:h-6 md:w-6 bg-red-500 border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-[8px] md:text-[10px] text-white font-black">{totalNotifications}</span>
                    </span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-72 md:w-80 p-2 rounded-2xl shadow-xl border-2" dir="rtl">
              <DropdownMenuLabel className="font-black p-2 text-md">التنبيهات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {systemNotifs && systemNotifs.length > 0 ? (
                  systemNotifs.map((n: any) => (
                    <DropdownMenuItem key={n.id} className="p-3 rounded-xl mb-1 cursor-pointer">
                      <div className="flex gap-3 text-right w-full">
                        <div className="bg-primary/10 p-2 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
                          <Bell className="text-primary h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-zinc-800 truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground font-bold truncate">{n.message}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-xs font-bold">لا توجد تنبيهات</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* اليسار: البروفايل */}
        <div className="shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 md:h-12 md:w-12 rounded-xl p-0 group overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={profile?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-sm">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 md:w-72 p-2 rounded-2xl shadow-xl border-2" dir="rtl">
                <DropdownMenuLabel className="font-black p-3 text-right border-b mb-1">
                  <div className="flex flex-col">
                    <span className="text-sm">{profile?.fullName}</span>
                    <span className="text-[10px] text-primary font-bold">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push('/profile')} className="p-3 rounded-xl cursor-pointer flex justify-end gap-3 font-bold text-sm">
                  الملف الشخصي <User className="h-4 w-4 text-primary" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-3 rounded-xl cursor-pointer flex justify-end gap-3 font-bold text-sm">
                  المحفظة <Layout className="h-4 w-4 text-accent" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut(auth).then(()=>router.push("/login"))} className="p-3 rounded-xl cursor-pointer text-destructive flex justify-end gap-3 font-bold text-sm">
                  تسجيل الخروج <LogOut className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/login')} className="h-9 md:h-11 px-4 md:px-6 rounded-xl font-black text-sm md:text-md shadow-sm">دخول</Button>
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
      className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all font-black text-xs md:text-sm whitespace-nowrap group shrink-0 border border-transparent hover:border-primary/10"
    >
      <Icon className="h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
