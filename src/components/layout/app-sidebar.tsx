
"use client";

import {
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  Home,
  X,
  LayoutDashboard,
  Users,
  ShieldCheck,
  BadgeCent,
  Lock,
  ChevronDown,
  Layers,
  Video,
  LifeBuoy,
  History,
  Smartphone,
  GraduationCap,
  ImageIcon,
  Wand2,
  CheckSquare,
  Scale,
  Palette
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const menuItems = [
  { title: "الرئيسية", icon: Home, href: "/" },
  { title: "المُفهمين", icon: GraduationCap, href: "/teachers" },
  { title: "استفهاماتي", icon: ClipboardList, href: "/requests" },
  { title: "المحفظة", icon: Wallet, href: "/wallet" },
  { title: "الدعم الفني", icon: LifeBuoy, href: "/support" },
  { title: "الإعدادات", icon: Settings, href: "/profile" },
];

const adminItems = [
  { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
  { title: "مركز الاعتماد", icon: CheckSquare, href: "/admin/approvals" },
  { title: "تخصيص المنصة", icon: Palette, href: "/admin/customize" },
  { title: "الذكاء الاصطناعي", icon: Wand2, href: "/admin/ai" },
  { title: "مركز الطعون", icon: Scale, href: "/admin/appeals" },
  { title: "إدارة المُفهمين", icon: Users, href: "/admin/mufahems" },
  { title: "إدارة المُستفهمين", icon: Users, href: "/admin/mustafhems" },
  { title: "رقابة المحاضرات", icon: Video, href: "/admin/all-requests" },
  { title: "مركز التوثيق", icon: ShieldCheck, href: "/admin/verification" },
  { title: "إدارة المالية", icon: BadgeCent, href: "/admin/finance" },
  { title: "تذاكر الدعم", icon: LifeBuoy, href: "/admin/support" },
  { title: "إدارة الأقسام", icon: Layers, href: "/admin/categories" },
  { title: "إدارة الصور", icon: ImageIcon, href: "/admin/assets" },
  { title: "سجل الرقابة", icon: History, href: "/admin/logs" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toggleSidebar, setOpenMobile } = useSidebar();

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

  const handleLogout = async () => {
    await signOut(auth);
    setOpenMobile(false);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <Sidebar side="right" collapsible="icon" className="border-l shadow-2xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-3 group">
            {/* استبدال اللوجو بالصورة المصغرة في البداية */}
            {settings?.miniIconUrl ? (
              <img src={settings.miniIconUrl} className="h-8 w-8 object-contain" alt="Mini Icon" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-black shrink-0">ف</div>
            )}
            
            {/* وضع اللوجو مكان الاسم فهمني للتعليم الذكي */}
            <div className="flex items-center group-data-[collapsible=icon]:hidden">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} className="h-12 w-auto object-contain" alt="Site Logo" />
              ) : (
                <div className="flex flex-col">
                  <span className="font-black text-2xl font-headline text-primary">{settings?.siteTitle || "فهمني"}</span>
                  <span className="text-[10px] text-accent font-black tracking-widest">التعليم الذكي</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <div className="p-4 group-data-[collapsible=icon]:hidden">
          <div className="bg-primary/5 p-4 rounded-3xl flex items-center gap-3 border-2 border-dashed border-primary/20">
            <Avatar className="h-12 w-12 border-2 border-primary/30">
              <AvatarImage src={profile?.profilePictureUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-black">{profile?.fullName?.charAt(0) || 'ف'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="font-black text-sm truncate">{profile?.fullName || 'جاري التحميل...'}</span>
              <span className="text-[10px] bg-primary text-white self-start px-2 py-0.5 rounded-full font-black mt-1">
                {profile?.isAdmin ? 'مسؤول' : (profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم')}
              </span>
            </div>
          </div>
        </div>

        <SidebarMenu className="px-3 space-y-2 pt-4">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} className="h-14 rounded-2xl">
                <Link href={item.href} onClick={() => setOpenMobile(false)} className="flex items-center gap-4 px-3">
                  <item.icon className={`h-6 w-6 ${pathname === item.href ? "text-white" : "text-primary"}`} />
                  <span className="font-black text-lg group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {profile?.isAdmin && (
            <Collapsible className="group/collapsible" defaultOpen={pathname.startsWith('/admin')}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="h-14 rounded-2xl">
                    <LayoutDashboard className="h-6 w-6 text-accent" />
                    <span className="font-black text-lg group-data-[collapsible=icon]:hidden">لوحة المسؤول</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-4 pr-4 border-r-2 border-accent/20 space-y-1 mt-2">
                    {adminItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                          <Link href={item.href} onClick={() => setOpenMobile(false)} className="font-black py-2">{item.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="h-14 rounded-2xl text-destructive hover:bg-destructive/5">
              <LogOut className="h-6 w-6" />
              <span className="font-black text-lg group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
