
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
  MessageSquare,
  Send,
  Filter,
  CloudUpload
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
import { useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, auth } = useFirebase();
  const { setOpen, setOpenMobile } = useSidebar();
  const firestore = useFirestore();
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

  // وظيفة للإغلاق التلقائي الفوري عند الضغط على أي رابط أو زر
  const handleLinkClick = () => {
    setOpen(false);
    setOpenMobile(false);
  };

  const menuItems = [
    { title: settings?.sideHome || "الرئيسية", icon: Home, href: "/" },
    { title: settings?.sideTeachers || "المُفهمين", icon: GraduationCap, href: "/teachers" },
    { title: settings?.sidePortfolio || "أعمال المفهمين", icon: ImageIcon, href: "/portfolio" },
    { title: settings?.sideRequests || "استفهاماتي", icon: ClipboardList, href: "/requests" },
    { title: "العروض", icon: Zap, href: "/offers" },
    { title: settings?.sideWallet || "المحفظة", icon: Wallet, href: "/wallet" },
    { title: settings?.sideSettings || "الإعدادات", icon: Settings, href: "/profile" },
  ];

  const adminItems = [
    { title: "نظرة عامة", icon: LayoutDashboard, href: "/admin" },
    { title: "تثبيت التعديلات", icon: CloudUpload, href: "/admin/deployment" },
    { title: "المحرر الفائق", icon: Edit3, href: "/admin/manual-editor" },
    { title: "الذكاء الاصطناعي", icon: Wand2, href: "/admin/ai" },
    { title: "رقابة المحاضرات", icon: Video, href: "/admin/all-requests" },
    { title: "رقابة الدردشات", icon: MessageSquare, href: "/admin/direct-chats" },
    { title: "سجلات الفيديو", icon: ShieldCheck, href: "/admin/sessions" },
    { title: "إدارة الحسابات", icon: UserCog, href: "/admin/accounts" },
    { title: "فريق العمل", icon: Shield, href: "/admin/roles" },
    { title: "مركز الاعتماد", icon: CheckSquare, href: "/admin/approvals" },
    { title: "مراجعة الاستفهامات", icon: FileCheck, href: "/admin/pending-requests" },
    { title: "مراجعة الأعمال", icon: FileSearch, href: "/admin/portfolio-approvals" },
    { title: "إدارة المعرض", icon: GalleryVertical, href: "/admin/portfolio-management" },
    { title: "إدارة المالية", icon: BadgeCent, href: "/admin/finance" },
    { title: "تذاكر الدعم", icon: LifeBuoy, href: "/admin/support" },
    { title: "الدردشة العائمة", icon: MessageCircle, href: "/admin/floating-chats" },
    { title: "إدارة التوظيف", icon: Briefcase, href: "/admin/jobs" },
    { title: "أقسام المنصة", icon: Layers, href: "/admin/categories" },
    { title: "أقسام المفهمين", icon: Filter, href: "/admin/teacher-categories" },
    { title: "الهوية و PWA", icon: ImageIcon, href: "/admin/assets" },
    { title: "قائمة تابعنا", icon: Share2, href: "/admin/social-management" },
    { title: "سجل الرقابة", icon: History, href: "/admin/logs" },
    { title: "الحظر التلقائي", icon: ShieldAlert, href: "/admin/auto-bans" },
    { title: "اختبار المراسلات", icon: Send, href: "/admin/comm-test" },
  ];

  const handleLogout = async () => {
    handleLinkClick();
    await signOut(auth);
    router.push("/login");
  };

  const toggleRole = async () => {
    if (!profile || !userRef) return;
    const newRole = profile.role === 'mufhem' ? 'mustafhem' : 'mufhem';
    try {
      handleLinkClick();
      await updateDoc(userRef, { role: newRole });
      toast({ title: "تم تبديل نوع الحساب" });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  if (!user) return null;

  return (
    <Sidebar side="right" collapsible="offcanvas" className="border-l shadow-sm fixed inset-y-0 z-50 bg-white">
      <SidebarHeader className="p-2 shrink-0">
        <Link href="/" className="flex items-center gap-1.5" onClick={handleLinkClick}>
          <div className="bg-primary w-7 h-7 rounded-lg flex items-center justify-center text-white text-lg font-black shrink-0 overflow-hidden border border-white/20 shadow-sm">
            {settings?.miniIconUrl ? <img src={settings.miniIconUrl} className="w-full h-full object-cover" alt="Logo" /> : "ف"}
          </div>
          <div className="truncate">
            <span className="font-black text-xs text-primary truncate block">{settings?.siteTitle || "فهمني"}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1.5">
        <div className="p-1.5 shrink-0">
          <div className="bg-primary/5 p-2 rounded-lg space-y-1.5 border border-primary/5">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { handleLinkClick(); router.push('/profile'); }}>
              <Avatar className="h-6 w-6 border border-white shadow-sm shrink-0">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback className="text-[8px]">{profile?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate min-w-0">
                <span className="font-black text-[9px] truncate text-right">{profile?.fullName}</span>
                <Badge variant="secondary" className="w-fit text-[6px] h-3 mt-0.5 ml-auto px-1">
                  {profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}
                </Badge>
              </div>
            </div>
            <button onClick={toggleRole} className="w-full h-6 rounded-md text-[8px] font-black border border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1">
              <RefreshCw className="h-2 w-2" /> تبديل الحساب
            </button>
          </div>
        </div>

        <SidebarMenu className="space-y-0.5 pt-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} className="h-8 rounded-lg" onClick={handleLinkClick}>
                <Link href={item.href} className="flex items-center gap-2 px-1.5">
                  <item.icon className={`h-3.5 w-3.5 shrink-0 ${pathname === item.href ? "text-white" : "text-primary"}`} />
                  <span className="font-bold text-[11px] truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {profile?.isAdmin && (
            <Collapsible className="group/collapsible" defaultOpen={pathname.startsWith('/admin')}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="h-8 rounded-lg">
                    <LayoutDashboard className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="font-bold text-[11px] truncate">{settings?.sideAdmin || "المسؤول"}</span>
                    <ChevronDown className="ml-auto h-2.5 w-2.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-1 pr-1.5 border-r border-accent/20 space-y-0.5 mt-0.5 max-h-[400px] overflow-y-auto no-scrollbar">
                    {adminItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href} className="h-7" onClick={handleLinkClick}>
                          <Link href={item.href} className="font-bold text-[10px] py-0.5 text-right w-full block truncate">{item.title}</Link>
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

      <SidebarFooter className="p-1.5 border-t shrink-0">
        <SidebarMenuButton onClick={handleLogout} className="h-8 rounded-lg text-destructive hover:bg-destructive/10">
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="font-bold text-[11px]">خروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
