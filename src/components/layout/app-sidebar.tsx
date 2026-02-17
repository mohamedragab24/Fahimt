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
  CheckSquare,
  Shield,
  ShieldAlert,
  UserCog,
  RefreshCw,
  FileCheck,
  Briefcase,
  Scale,
  MessageCircle,
  FileSearch,
  GalleryVertical,
  Edit3,
  Wand2,
  Mail,
  Zap,
  ListTodo
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

  const menuItems = [
    { title: settings?.sideHome || "الرئيسية", icon: Home, href: "/" },
    { title: settings?.sideTeachers || "المُفهمين", icon: GraduationCap, href: "/teachers" },
    { title: settings?.sidePortfolio || "أعمال المفهمين", icon: ImageIcon, href: "/portfolio" },
    { title: settings?.sideRequests || "استفهاماتي", icon: ClipboardList, href: "/requests" },
    { title: "العروض المتقدمة", icon: Zap, href: "/offers" },
    { title: settings?.sideWallet || "المحفظة", icon: Wallet, href: "/wallet" },
    { title: settings?.sideSettings || "الإعدادات", icon: Settings, href: "/profile" },
  ];

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

  const adminItems = [
    { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
    { title: "المحرر المرئي", icon: Edit3, href: "/admin/manual-editor" },
    { title: "الإدارة بالذكاء الاصطناعي", icon: Wand2, href: "/admin/ai" },
    { title: "رقابة المحاضرات", icon: Video, href: "/admin/all-requests" },
    { title: "إدارة الحسابات", icon: UserCog, href: "/admin/accounts" },
    { title: "فريق العمل", icon: Shield, href: "/admin/roles" },
    { title: "مركز الاعتماد", icon: CheckSquare, href: "/admin/approvals" },
    { title: "الطلبات قيد المراجعة", icon: FileCheck, href: "/admin/pending-requests" },
    { title: "مراجعة أعمال المفهمين", icon: FileSearch, href: "/admin/portfolio-approvals" },
    { title: "إدارة معرض الأعمال", icon: GalleryVertical, href: "/admin/portfolio-management" },
    { title: "أقسام المفهمين", icon: Layers, href: "/admin/teacher-categories" },
    { title: "سجلات الفيديو", icon: Video, href: "/admin/sessions" },
    { title: "إدارة الوظائف", icon: Briefcase, href: "/admin/jobs" },
    { title: "النافذة العائمة", icon: MessageCircle, href: "/admin/floating-chats" },
    { title: "الحظر التلقائي", icon: ShieldAlert, href: "/admin/auto-bans" },
    { title: "مركز الطعون", icon: Scale, href: "/admin/appeals" },
    { title: "إدارة المالية", icon: BadgeCent, href: "/admin/finance" },
    { title: "تذاكر الدعم", icon: LifeBuoy, href: "/admin/support" },
    { title: "إدارة الأقسام", icon: Layers, href: "/admin/categories" },
    { title: "تخصيص الهوية", icon: Settings, href: "/admin/customize" },
    { title: "إدارة الصور", icon: ImageIcon, href: "/admin/assets" },
    { title: "سجل الرقابة", icon: History, href: "/admin/logs" },
    { title: "اختبار المراسلات", icon: Mail, href: "/admin/comm-test" },
  ];

  return (
    <Sidebar side="right" collapsible="icon" className="border-l shadow-2xl">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-white text-3xl font-black shrink-0 overflow-hidden">
            {settings?.miniIconUrl ? <img src={settings.miniIconUrl} className="w-full h-full object-cover" /> : "ف"}
          </div>
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
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback>{profile?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="font-black text-sm truncate text-right">{profile?.fullName}</span>
                <Badge className="w-fit text-[10px] ml-auto">{profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}</Badge>
              </div>
            </div>
            <button onClick={toggleRole} className="w-full h-10 rounded-xl text-xs font-bold border-2 border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
              <RefreshCw className="h-3 w-3" /> {profile?.role === 'mufhem' ? (settings?.sideToggleToStudent || "تبديل إلى مُستفهم") : (settings?.sideToggleToTeacher || "تبديل إلى مُفهم")}
            </button>
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
                    <span className="font-black text-lg group-data-[collapsible=icon]:hidden">{settings?.sideAdmin || "لوحة المسؤول"}</span>
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
          <span className="font-black text-lg group-data-[collapsible=icon]:hidden">{settings?.sideLogout || "تسجيل الخروج"}</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
