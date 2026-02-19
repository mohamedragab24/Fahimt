
"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, Mail, GraduationCap, Layout, Search } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase, useUser } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ترويسة الموقع المحدثة - تشمل اللوجو الأساسي في اليمين بجانب الزر، والروابط في اليسار.
 */
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

  const isExcludedPath = pathname === "/" || pathname === "/login" || pathname === "/forgot-password" || pathname === "/signup";
  const shouldHideGlobalHeader = isExcludedPath && !user;

  const goToProfile = () => {
    setOpen(false);
    setOpenMobile(false);
    router.push('/profile');
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm overflow-hidden shrink-0",
      shouldHideGlobalHeader ? "hidden" : "block h-14 md:h-16"
    )}>
      {mounted && !shouldHideGlobalHeader && (
        <div className="flex h-full items-center justify-between px-4 md:px-8 max-w-[1920px] mx-auto gap-4">
          
          <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
            {/* اللوجو الأساسي في اليمين بجانب زر القائمة */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="bg-primary w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-lg overflow-hidden border border-white/20">
                {settings?.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" /> : "ف"}
              </div>
              <span className="text-primary font-black text-xl md:text-3xl hidden xs:block">{settings?.siteTitle || "فهمني"}</span>
            </Link>
            
            {user && <SidebarTrigger className="h-9 w-9 text-accent bg-accent/5 hover:bg-accent/10 rounded-xl shrink-0" />}
          </div>

          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            
            {user && (
              <div className="flex items-center gap-2 md:gap-4">
                {/* روابط التنقل في اليسار بجانب الأيقونات */}
                <nav className="hidden md:flex items-center gap-2 px-4 border-l border-zinc-100 py-1">
                  <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
                  <HeaderNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
                  <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
                </nav>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { setOpen(false); setOpenMobile(false); router.push('/messages'); }}
                  className="relative h-10 w-10 rounded-xl hover:bg-primary/5 text-zinc-500"
                >
                  <Mail className="h-6 w-6" />
                  {totalMessages > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-accent border-2 border-white shadow-sm flex items-center justify-center">
                         <span className="text-[8px] text-white font-black">{totalMessages}</span>
                      </span>
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-primary/5 text-zinc-500">
                      <Bell className="h-6 w-6" />
                      {totalNotifications > 0 && (
                        <span className="absolute top-0 right-0 flex h-4 w-4">
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white shadow-sm flex items-center justify-center">
                            <span className="text-[8px] text-white font-black">{totalNotifications}</span>
                          </span>
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-72 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
                    <DropdownMenuLabel className="font-black p-2 text-sm">التنبيهات</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-80 overflow-y-auto">
                      {systemNotifs && systemNotifs.length > 0 ? (
                        systemNotifs.map((n: any) => (
                          <DropdownMenuItem key={n.id} className="p-3 rounded-xl mb-1 cursor-pointer">
                            <div className="flex gap-3 text-right w-full">
                              <div className="bg-primary/10 p-2 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
                                <Bell className="text-primary h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-xs text-zinc-800 truncate">{n.title}</p>
                                <p className="text-[10px] text-muted-foreground font-bold truncate">{n.message}</p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-6 text-center text-muted-foreground text-sm font-bold">لا توجد تنبيهات</div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="mr-1">
              {user ? (
                <Button 
                  variant="ghost" 
                  onClick={goToProfile}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all shadow-md group"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={profile?.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/5 text-primary font-black text-sm">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push('/login')} 
                  className="h-10 md:h-12 px-6 md:px-8 rounded-xl font-black text-sm md:text-md bg-primary hover:bg-primary/90 text-white shadow-lg"
                >
                  دخول
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function HeaderNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  const { setOpen, setOpenMobile } = useSidebar();
  return (
    <Link 
      href={href} 
      onClick={() => { setOpen(false); setOpenMobile(false); }}
      className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-zinc-600 hover:text-primary hover:bg-primary/5 transition-all font-black text-sm md:text-md whitespace-nowrap group shrink-0 border border-transparent"
    >
      <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
