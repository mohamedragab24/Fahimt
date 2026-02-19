
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
      <SidebarHeader className="p-4 shrink-0">
        {/* تم حذف اللوجو المكرر هنا والاكتفاء بالمحتوى المباشر */}
        <div className="flex flex-col gap-1">
          <span className="font-black text-xs text-zinc-400">القائمة الرئيسية</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1.5">
        <div className="p-1.5 shrink-0">
          <div className="bg-primary/5 p-3 rounded-2xl space-y-2.5 border border-primary/5 shadow-inner">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { handleLinkClick(); router.push('/profile'); }}>
              <Avatar className="h-8 w-8 border-2 border-white shadow-md shrink-0">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback className="text-[10px]">{profile?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate min-w-0">
                <span className="font-black text-[11px] truncate text-right">{profile?.fullName}</span>
                <Badge variant="secondary" className="w-fit text-[7px] h-4 mt-0.5 ml-auto px-1.5 font-black">
                  {profile?.role === 'mufhem' ? 'مُفهم معتمد' : 'مُستفهم طموح'}
                </Badge>
              </div>
            </div>
            <button onClick={toggleRole} className="w-full h-8 rounded-xl text-[10px] font-black border-2 border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm">
              <RefreshCw className="h-3 w-3" /> تبديل الحساب
            </button>
          </div>
        </div>

        <SidebarMenu className="space-y-1 pt-2 overflow-y-auto no-scrollbar px-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} className="h-10 rounded-xl" onClick={handleLinkClick}>
                <Link href={item.href} className="flex items-center gap-3 px-2">
                  <item.icon className={`h-4 w-4 shrink-0 ${pathname === item.href ? "text-white" : "text-primary"}`} />
                  <span className="font-bold text-[13px] truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {profile?.isAdmin && (
            <Collapsible className="group/collapsible" defaultOpen={pathname.startsWith('/admin')}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="h-10 rounded-xl">
                    <LayoutDashboard className="h-4 w-4 text-accent shrink-0" />
                    <span className="font-bold text-[13px] truncate">{settings?.sideAdmin || "لوحة التحكم"}</span>
                    <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-2 pr-2 border-r-2 border-accent/20 space-y-1 mt-1 max-h-[450px] overflow-y-auto no-scrollbar">
                    {adminItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href} className="h-8" onClick={handleLinkClick}>
                          <Link href={item.href} className="font-bold text-[11px] py-1 text-right w-full block truncate">{item.title}</Link>
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

      <SidebarFooter className="p-2 border-t shrink-0">
        <SidebarMenuButton onClick={handleLogout} className="h-10 rounded-xl text-destructive hover:bg-destructive/10 font-black">
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="text-[12px]">تسجيل الخروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
