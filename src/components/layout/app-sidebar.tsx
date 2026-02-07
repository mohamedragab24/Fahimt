
"use client";

import {
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  HelpCircle,
  Home,
  Sparkles,
  X,
  LayoutDashboard,
  Users,
  ShieldCheck,
  BadgeCent,
  Lock,
  ChevronDown,
  Layers,
  Video,
  LifeBuoy
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
  { title: "طلباتي", icon: ClipboardList, href: "/requests" },
  { title: "المحفظة", icon: Wallet, href: "/wallet" },
  { title: "الدعم الفني", icon: LifeBuoy, href: "/support" },
  { title: "الإعدادات", icon: Settings, href: "/profile" },
];

const adminItems = [
  { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
  { title: "إدارة المفهمين", icon: Users, href: "/admin/mufahems" },
  { title: "إدارة المستفهمين", icon: Users, href: "/admin/mustafhems" },
  { title: "رقابة المحاضرات", icon: Video, href: "/admin/all-requests" },
  { title: "مركز التوثيق", icon: ShieldCheck, href: "/admin/verification" },
  { title: "إدارة المالية", icon: BadgeCent, href: "/admin/finance" },
  { title: "تذاكر الدعم", icon: LifeBuoy, href: "/admin/support" },
  { title: "إدارة الأقسام", icon: Layers, href: "/admin/categories" },
  { title: "الصلاحيات", icon: Lock, href: "/admin/roles" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const { toggleSidebar } = useSidebar();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    if (user?.email === "mohamed76y@gmail.com" && profile && !profile.isAdmin && firestore) {
      const ref = doc(firestore, "users", user.uid);
      updateDoc(ref, { 
        isAdmin: true,
        adminPermissions: ["superadmin"] 
      });
    }
  }, [user, profile, firestore]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <Sidebar side="right" collapsible="icon" className="border-l shadow-2xl">
      <SidebarHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="bg-primary w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden whitespace-nowrap transition-all">
              <span className="font-black text-2xl font-headline leading-tight">فهمني</span>
              <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">التعليم الذكي</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden h-10 w-10 rounded-xl hover:bg-primary/5 text-muted-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <div className="p-4 group-data-[collapsible=icon]:hidden">
          <div className="bg-muted/30 p-4 rounded-2xl flex items-center gap-3 border border-dashed border-primary/20">
            <Avatar className="h-12 w-12 min-w-[48px] border-2 border-primary/20 shadow-sm">
              <AvatarImage src={profile?.profilePictureUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.fullName?.charAt(0) || 'ف'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm truncate">{profile?.fullName || 'جاري التحميل...'}</span>
              <span className="text-[10px] bg-primary/10 text-primary self-start px-2 py-0.5 rounded-full font-bold">
                {profile?.isAdmin ? 'مسؤول' : (profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم')}
              </span>
            </div>
          </div>
        </div>

        <SidebarMenu className="px-3 space-y-2 pt-4">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                className={`h-14 rounded-xl transition-all ${
                  pathname === item.href 
                    ? "bg-primary text-white shadow-lg hover:bg-primary/90" 
                    : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
                }`}
              >
                <Link href={item.href} className="flex items-center gap-4 px-3 w-full">
                  <item.icon className={`h-6 w-6 shrink-0 ${pathname === item.href ? "text-white" : "text-primary"}`} />
                  <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {profile?.isAdmin && (
            <Collapsible asChild className="group/collapsible" defaultOpen={pathname.startsWith('/admin')}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip="لوحة المسؤول" 
                    className={`h-14 rounded-xl transition-all ${
                      pathname.startsWith('/admin') 
                        ? "bg-accent text-white shadow-lg" 
                        : "hover:bg-accent/10 text-muted-foreground hover:text-accent"
                    }`}
                  >
                    <LayoutDashboard className={`h-6 w-6 shrink-0 ${pathname.startsWith('/admin') ? "text-white" : "text-accent"}`} />
                    <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">لوحة المسؤول</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-4 pr-4 border-r-2 border-accent/20 space-y-1 mt-2">
                    {adminItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                          <Link href={item.href} className="flex items-center gap-3 py-2">
                            <item.icon className="h-4 w-4" />
                            <span className="font-bold">{item.title}</span>
                          </Link>
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

      <SidebarFooter className="p-4 space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="اتصل بنا واتساب"
              className="h-14 rounded-xl hover:bg-green-50 hover:text-green-600 transition-colors border-2 border-transparent hover:border-green-100"
            >
              <Link href="https://wa.me/201234567890" target="_blank" className="flex items-center gap-4 px-3 w-full">
                <HelpCircle className="h-6 w-6 shrink-0 text-green-500" />
                <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">اتصال مباشر</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarSeparator className="my-2" />
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="h-14 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive transition-colors"
            >
              <div className="flex items-center gap-4 px-3 w-full">
                <LogOut className="h-6 w-6 shrink-0" />
                <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
