"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, Mail, GraduationCap, Layout, Search, Menu } from "lucide-react";
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

  const miniLogo = settings?.miniIconUrl || settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo-official')?.imageUrl;

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm overflow-hidden shrink-0 transition-all duration-300 h-16 md:h-20",
      shouldHideGlobalHeader && "hidden"
    )}>
      {mounted && !shouldHideGlobalHeader && (
        <div className="flex h-full items-center justify-between px-4 md:px-8 max-w-[1920px] mx-auto gap-4">
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-10 w-10 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-xl shrink-0 border-2 border-zinc-100 flex items-center justify-center">
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
              
              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                  <img src={miniLogo} className="w-full h-full object-contain" alt="Logo" />
                </div>
                <span className="text-primary font-black text-xl md:text-3xl hidden xs:block">{settings?.siteTitle || "فهمني"}</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0 flex-row-reverse">
            
            <div className="mr-1">
              <Button 
                variant="ghost" 
                onClick={goToProfile}
                className="h-12 w-12 md:h-14 md:w-14 rounded-2xl p-0 overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all shadow-md group"
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="bg-primary/5 text-primary font-black text-lg">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                </Avatar>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl hover:bg-primary/5 text-zinc-500">
                  <Bell className="h-7 w-7" />
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

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/messages')}
              className="relative h-12 w-12 rounded-2xl hover:bg-primary/5 text-zinc-500"
            >
              <Mail className="h-7 w-7" />
              {totalMessages > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5">
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-accent border-2 border-white shadow-sm flex items-center justify-center">
                     <span className="text-[10px] text-white font-black">{totalMessages}</span>
                  </span>
                </span>
              )}
            </Button>

            <nav className="hidden lg:flex items-center gap-2 px-4 border-r border-zinc-100 py-1">
              <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
              <HeaderNavLink href="/portfolio" icon={Layout} label="أعمال المفهمين" />
              <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
            </nav>

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
      className="flex items-center gap-2.5 px-4 md:px-5 py-2.5 rounded-2xl text-zinc-600 hover:text-primary hover:bg-primary/5 transition-all font-black text-md md:text-lg whitespace-nowrap group shrink-0"
    >
      <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
