
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
  Share2,
  MessageSquare
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

/**
 * القائمة الجانبية المطورة - رشيقة وموفرة للمساحة لتعمل بسلاسة على كافة الشاشات.
 */
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
    { title: settings?.sidePortfolio || "الأعمال", icon: ImageIcon, href: "/portfolio" },
    { title: settings?.sideRequests || "استفهاماتي", icon: ClipboardList, href: "/requests" },
    { title: "العروض", icon: Zap, href: "/offers" },
    { title: settings?.sideWallet || "المحفظة", icon: Wallet, href: "/wallet" },
    { title: settings?.sideSettings || "الإعدادات", icon: Settings, href: "/profile" },
  ];

  const adminItems = [
    { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
    { title: "المحرر", icon: Edit3, href: "/admin/manual-editor" },
    { title: "الذكاء الاصطناعي", icon: Wand2, href: "/admin/ai" },
    { title: "رقابة المحاضرات", icon: Video, href: "/admin/all-requests" },
    { title: "رقابة الدردشات", icon: MessageSquare, href: "/admin/direct-chats" },
    { title: "إدارة الحسابات", icon: UserCog, href: "/admin/accounts" },
    { title: "فريق العمل", icon: Shield, href: "/admin/roles" },
    { title: "الاعتماد", icon: CheckSquare, href: "/admin/approvals" },
    { title: "طلبات المراجعة", icon: FileCheck, href: "/admin/pending-requests" },
    { title: "مراجعة الأعمال", icon: FileSearch, href: "/admin/portfolio-approvals" },
    { title: "إدارة الأعمال", icon: GalleryVertical, href: "/admin/portfolio-management" },
    { title: "إدارة المالية", icon: BadgeCent, href: "/admin/finance" },
    { title: "تذاكر الدعم", icon: LifeBuoy, href: "/admin/support" },
    { title: "الأقسام", icon: Layers, href: "/admin/categories" },
    { title: "الهوية والصور", icon: ImageIcon, href: "/admin/assets" },
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

  return (
    <Sidebar side="right" collapsible="icon" className="border-l shadow-lg">
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary w-9 h-9 rounded-lg flex items-center justify-center text-white text-xl font-black shrink-0 overflow-hidden border-2 border-white/20 shadow-md">
            {settings?.miniIconUrl ? <img src={settings.miniIconUrl} className="w-full h-full object-cover" /> : "ف"}
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="font-black text-xl text-primary">{settings?.siteTitle || "فهمني"}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <div className="p-2 group-data-[collapsible=icon]:hidden">
          <div className="bg-primary/5 p-2.5 rounded-xl space-y-2.5 border border-primary/5">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-white shadow-sm">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback className="text-[10px]">{profile?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="font-black text-[11px] truncate text-right">{profile?.fullName}</span>
                <Badge variant="secondary" className="w-fit text-[7px] h-3.5 mt-0.5 ml-auto px-1">
                  {profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}
                </Badge>
              </div>
            </div>
            <button onClick={toggleRole} className="w-full h-7 rounded-lg text-[9px] font-black border-2 border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1">
              <RefreshCw className="h-2.5 w-2.5" /> تبديل
            </button>
          </div>
        </div>

        <SidebarMenu className="space-y-0.5 pt-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} className="h-10 rounded-lg">
                <Link href={item.href} onClick={() => setOpenMobile(false)} className="flex items-center gap-2.5 px-2">
                  <item.icon className={`h-4.5 w-4.5 ${pathname === item.href ? "text-white" : "text-primary"}`} />
                  <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {profile?.isAdmin && (
            <Collapsible className="group/collapsible" defaultOpen={pathname.startsWith('/admin')}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="h-10 rounded-lg">
                    <LayoutDashboard className="h-4.5 w-4.5 text-accent" />
                    <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">{settings?.sideAdmin || "المسؤول"}</span>
                    <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-2 pr-2 border-r border-accent/20 space-y-0.5 mt-0.5">
                    {adminItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href} className="h-8">
                          <Link href={item.href} onClick={() => setOpenMobile(false)} className="font-bold text-[11px] py-1 text-right w-full block">{item.title}</Link>
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

      <SidebarFooter className="p-2">
        <SidebarMenuButton onClick={handleLogout} className="h-10 rounded-lg text-destructive hover:bg-destructive/10">
          <LogOut className="h-4.5 w-4.5" />
          <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">خروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
