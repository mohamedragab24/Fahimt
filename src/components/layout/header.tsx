
"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User, LogOut, Mail, GraduationCap, Layout, Search } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase, useUser } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import Link from "next/link";

/**
 * ترويسة الموقع الرشيقة - تم إخفاؤها تماماً للزوار في صفحات الهبوط والدخول لمنع الازدواجية.
 */
export function Header() {
  const [mounted, setMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
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

  // استبعاد الترويسة العالمية تماماً للزوار في هذه الصفحات
  const isExcludedPath = pathname === "/" || pathname === "/login" || pathname === "/forgot-password";

  // إذا لم يكتمل التحميل أو كان المستخدم زائراً في صفحة مستبعدة، لا تظهر الترويسة العالمية
  if (!mounted) return null;
  if (isExcludedPath && !user && !isUserLoading) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm overflow-hidden shrink-0">
      <div className="flex h-12 md:h-14 items-center justify-between px-2 md:px-4 max-w-[1920px] mx-auto gap-1">
        
        <div className="flex items-center gap-1.5 md:gap-3 flex-1 min-w-0">
          {/* زر القائمة يظهر فقط للمسجلين أو في الصفحات الداخلية */}
          {user && <SidebarTrigger className="h-7 w-7 text-accent bg-accent/5 hover:bg-accent/10 rounded-lg shrink-0" />}
          
          <nav className="flex items-center gap-0.5 md:gap-2 border-r pr-1 md:pr-3 border-zinc-100 overflow-x-auto no-scrollbar py-0.5">
            <HeaderNavLink href="/teachers" icon={GraduationCap} label="المُفهمين" />
            <HeaderNavLink href="/portfolio" icon={Layout} label="الأعمال" />
            <HeaderNavLink href="/browse" icon={Search} label="الاستفهامات" />
          </nav>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          
          {/* أيقونات التنبيهات والدردشة تظهر فقط للمسجلين */}
          {!isUserLoading && user && (
            <div className="flex items-center gap-0.5 md:gap-1.5 animate-in fade-in slide-in-from-left-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/messages')}
                className="relative h-7 w-7 rounded-lg hover:bg-primary/5 text-zinc-500"
              >
                <Mail className="h-4 w-4" />
                {totalMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent border border-white shadow-sm flex items-center justify-center">
                       <span className="text-[5px] text-white font-black">{totalMessages}</span>
                    </span>
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-7 w-7 rounded-lg hover:bg-primary/5 text-zinc-500">
                    <Bell className="h-4 w-4" />
                    {totalNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white shadow-sm flex items-center justify-center">
                          <span className="text-[5px] text-white font-black">{totalNotifications}</span>
                        </span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 p-1.5 rounded-2xl shadow-xl border-2" dir="rtl">
                  <DropdownMenuLabel className="font-black p-2 text-[11px]">التنبيهات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-60 overflow-y-auto">
                    {systemNotifs && systemNotifs.length > 0 ? (
                      systemNotifs.map((n: any) => (
                        <DropdownMenuItem key={n.id} className="p-2 rounded-xl mb-0.5 cursor-pointer">
                          <div className="flex gap-2 text-right w-full">
                            <div className="bg-primary/10 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center shrink-0">
                              <Bell className="text-primary h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-[10px] text-zinc-800 truncate">{n.title}</p>
                              <p className="text-[8px] text-muted-foreground font-bold truncate">{n.message}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-[10px] font-bold">لا توجد تنبيهات</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="mr-0.5">
            {!isUserLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-7 w-7 md:h-8 md:w-8 rounded-lg p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all shadow-sm">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile?.profilePictureUrl} />
                      <AvatarFallback className="bg-primary/5 text-primary font-black text-[10px]">{profile?.fullName?.charAt(0) || "ف"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border-2" dir="rtl">
                  <DropdownMenuLabel className="font-black p-2 text-right border-b mb-1">
                    <div className="flex flex-col">
                      <span className="text-[11px]">{profile?.fullName}</span>
                      <span className="text-[8px] text-primary font-bold">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="p-2 rounded-xl cursor-pointer flex justify-end gap-2 font-bold text-[11px]">
                    الملف الشخصي <User className="h-3.5 w-3.5 text-primary" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-2 rounded-xl cursor-pointer flex justify-end gap-2 font-bold text-[11px]">
                    المحفظة <Layout className="h-3.5 w-3.5 text-accent" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut(auth).then(()=>router.push("/login"))} className="p-2 rounded-xl cursor-pointer text-destructive flex justify-end gap-2 font-bold text-[11px]">
                    تسجيل الخروج <LogOut className="h-3.5 w-3.5" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isUserLoading && (
              <Button 
                onClick={() => router.push('/login')} 
                className="h-7 md:h-8 px-3 md:px-5 rounded-lg font-black text-[10px] md:text-xs bg-primary hover:bg-primary/90 text-white shadow-md"
              >
                دخول
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderNavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all font-black text-[10px] md:text-xs whitespace-nowrap group shrink-0 border border-transparent"
    >
      <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
      <span>{label}</span>
    </Link>
  );
}
