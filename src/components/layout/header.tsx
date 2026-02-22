
"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, Mail, GraduationCap, Layout, Search, Menu, User, Zap, MessageSquare } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase, useUser } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { setOpen, setOpenMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

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

  const unreadChatsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !mounted) return null;
    return query(
      collection(firestore, "direct_chats"),
      where("participants", "array-contains", user.uid),
      where("hasUnread", "==", true),
      where("lastSenderId", "!=", user.uid)
    );
  }, [firestore, user, mounted]);
  const { data: unreadChats } = useCollection(unreadChatsQuery);

  const totalNotifications = systemNotifs?.filter(n => !n.read).length || 0;
  const totalMessages = unreadChats?.length || 0;

  const isExcludedPath = pathname === "/" || pathname === "/login" || pathname === "/forgot-password" || pathname === "/signup";
  const shouldHideGlobalHeader = isExcludedPath && !user;

  const goToProfile = () => {
    setOpen(false);
    setOpenMobile(false);
    router.push('/profile');
  };

  const miniLogo = settings?.miniIconUrl || settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo-official')?.imageUrl;

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm overflow-hidden shrink-0 transition-all duration-300 h-16 md:h-20",
      shouldHideGlobalHeader && "hidden"
    )}>
      {mounted && !shouldHideGlobalHeader && (
        <div className="flex h-full items-center justify-between px-4 md:px-8 max-w-[1920px] mx-auto gap-4">
          
          {/* جهة اليمين: زر القائمة الجانبية (البرتقالي) ثم اللوجو */}
          <div className="flex items-center gap-4 shrink-0">
            <SidebarTrigger className="h-10 w-10 md:h-12 md:w-12 text-white bg-accent hover:bg-accent/90 rounded-xl shrink-0 border-none flex items-center justify-center shadow-lg transition-transform active:scale-95">
              <Menu className="h-6 w-6 md:h-7 md:w-7" />
            </SidebarTrigger>

            <Link href="/" className="flex items-center group shrink-0">
              <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 bg-transparent">
                <img src={miniLogo} className="w-full h-full object-contain" alt="Logo" />
              </div>
            </Link>
          </div>

          {/* جهة اليسار: الروابط والرسائل والبروفايل */}
          <div className="flex items-center gap-1 md:gap-4 shrink-0">
            
            {/* روابط التنقل - تظهر بوضوح مع الأيقونة والاسم */}
            <nav className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-100">
              <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
              <HeaderNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
              <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
            </nav>

            <div className="flex items-center gap-1 md:gap-2">
              {/* الرسائل */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/messages')}
                className="relative h-10 w-10 md:h-12 md:w-12 rounded-2xl hover:bg-primary/5 text-zinc-500"
              >
                <Mail className="h-6 w-6 md:h-7 md:size-7" />
                {totalMessages > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5">
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-accent border-2 border-white shadow-sm flex items-center justify-center">
                       <span className="text-[10px] text-white font-black">{totalMessages}</span>
                    </span>
                  </span>
                )}
              </Button>

              {/* التنبيهات */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 md:h-12 md:w-12 rounded-2xl hover:bg-primary/5 text-zinc-500">
                    <Bell className="h-6 w-6 md:h-7 md:size-7" />
                    {totalNotifications > 0 && (
                      <span className="absolute top-1 right-1 flex h-5 w-5">
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="text-[10px] text-white font-black">{totalNotifications}</span>
                        </span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-80 p-2 rounded-[2rem] shadow-2xl border-2" dir="rtl">
                  <DropdownMenuLabel className="font-black p-4 text-lg text-right">التنبيهات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {systemNotifs && systemNotifs.length > 0 ? (
                      systemNotifs.map((n: any) => (
                        <DropdownMenuItem key={n.id} className="p-4 rounded-2xl mb-1 cursor-pointer">
                          <div className="flex gap-4 text-right w-full">
                            <div className="bg-primary/10 p-3 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                              <Bell className="text-primary h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-sm text-zinc-800 truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground font-bold line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-10 text-center text-muted-foreground text-md font-bold">لا توجد تنبيهات جديدة</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* زر الدخول أو البروفايل */}
              <div className="mr-2">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-10 w-10 md:h-14 md:w-14 rounded-2xl p-0 overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all shadow-md group"
                      >
                        <Avatar className="h-full w-full">
                          <AvatarImage src={profile?.profilePictureUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black text-lg">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 p-4 rounded-[2rem] shadow-2xl border-2" dir="rtl">
                      <div className="flex flex-col items-center gap-3 py-4">
                        <Avatar className="h-20 w-20 border-4 border-primary/10">
                          <AvatarImage src={profile?.profilePictureUrl} />
                          <AvatarFallback>{profile?.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="font-black text-lg">{profile?.fullName}</p>
                          <p className="text-xs text-muted-foreground font-bold">{profile?.email}</p>
                          <Badge className="mt-2">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/profile')} className="p-3 rounded-xl font-bold cursor-pointer">الملف الشخصي</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-3 rounded-xl font-bold cursor-pointer">المحفظة</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    onClick={() => router.push('/login')}
                    className="h-10 md:h-12 px-6 md:px-8 bg-primary hover:bg-primary/90 text-white font-black rounded-xl md:rounded-2xl text-md md:text-lg shadow-lg transition-all hover:scale-105"
                  >
                    دخول
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}

function HeaderNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  const { setOpen, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      onClick={() => { setOpen(false); setOpenMobile(false); }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-black text-sm whitespace-nowrap group shrink-0",
        isActive ? "text-primary bg-primary/5 shadow-inner" : "text-zinc-600 hover:text-primary hover:bg-primary/5"
      )}
    >
      <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
      <span className="md:inline">{label}</span>
    </Link>
  );
}
