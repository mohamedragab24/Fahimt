
"use client";

import {
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  Home,
  LayoutDashboard,
  Users,
  ShieldCheck,
  BadgeCent,
  ChevronDown,
  Layers,
  Video,
  LifeBuoy,
  History,
  GraduationCap,
  ImageIcon,
  Wand2,
  CheckSquare,
  Scale,
  Palette,
  RefreshCw,
  FileCheck,
  Shield,
  ShieldAlert,
  UserCog
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
  SidebarSeparator as SidebarSep,
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
  { title: "إدارة الحسابات", icon: UserCog, href: "/admin/accounts" },
  { title: "فريق العمل", icon: Shield, href: "/admin/roles" },
  { title: "مركز الاعتماد", icon: CheckSquare, href: "/admin/approvals" },
  { title: "الطلبات قيد المراجعة", icon: FileCheck, href: "/admin/pending-requests" },
  { title: "رقابة المحاضرات", icon: Video, href: "/admin/sessions" },
  { title: "الحظر التلقائي", icon: ShieldAlert, href: "/admin/auto-bans" },
  { title: "تخصيص المنصة", icon: Palette, href: "/admin/customize" },
  { title: "الذكاء الاصطناعي", icon: Wand2, href: "/admin/ai" },
  { title: "مركز الطعون", icon: Scale, href: "/admin/appeals" },
  { title: "إدارة المُفهمين", icon: Users, href: "/admin/mufahems" },
  { title: "إدارة المُستفهمين", icon: Users, href: "/admin/mustafhems" },
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
  const { setOpenMobile } = useSidebar();
  const { toast } = useToast();

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

  const toggleRole = async () => {
    if (!profile || !userRef) return;
    const newRole = profile.role === 'mufhem' ? 'mustafhem' : 'mufhem';
    try {
      await updateDoc(userRef, { role: newRole });
      toast({ title: "تم تبديل نوع الحساب", description: `أنت الآن تتصفح كـ ${newRole === 'mufhem' ? 'مُفهم' : 'مُستفهم'}` });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في التبديل" });
    }
  };

  if (!user) return null;

  return (
    <Sidebar side="right" collapsible="icon" className="border-l shadow-2xl">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3">
          {settings?.miniIconUrl ? (
            <img src={settings.miniIconUrl} className="h-14 w-14 object-contain rounded-xl" alt="Icon" />
          ) : (
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-3xl font-black">ف</div>
          )}
          <div className="group-data-[collapsible=icon]:hidden">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="h-16 w-auto object-contain" alt="Site Logo" />
            ) : (
              <span className="font-black text-3xl text-primary">{settings?.siteTitle || "فهمني"}</span>
            )}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <div className="p-4 group-data-[collapsible=icon]:hidden">
          <div className="bg-primary/5 p-4 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback>{profile?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="font-black text-sm truncate text-right">{profile?.fullName}</span>
                <Badge className="w-fit text-[10px] ml-auto">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
              </div>
            </div>
            <Button onClick={toggleRole} variant="outline" className="w-full h-10 rounded-xl text-xs font-bold border-2 border-primary/20 hover:bg-primary hover:text-white transition-all">
              <RefreshCw className="ml-2 h-3 w-3" /> تبديل إلى {profile?.role === 'mufhem' ? 'مُستفهم' : 'مُفهم'}
            </Button>
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
                          <Link href={item.href} onClick={() => setOpenMobile(false)} className="font-black py-2 text-right w-full block">{item.title}</Link>
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
        <SidebarMenuButton onClick={handleLogout} className="h-14 rounded-2xl text-destructive">
          <LogOut className="h-6 w-6" />
          <span className="font-black text-lg group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
