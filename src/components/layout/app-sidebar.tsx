
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
  LifeBuoy,
  History,
  GraduationCap,
  ImageIcon,
  Shield,
  ShieldAlert,
  FileCheck,
  Briefcase,
  HelpCircle,
  MessageSquare,
  Zap,
  Share2,
  User,
  Search,
  RefreshCw,
  Palette,
  Cloud,
  Clock,
  Ticket,
  CheckCircle2,
  BookOpen,
  Filter,
  UserCog,
  FileSearch,
  Activity,
  Bot,
  Send,
  Eye,
  Layout,
  Scale
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

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  const handleLinkClick = () => {
    setOpen(false);
    setOpenMobile(false);
  };

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
      toast({ title: "تم تبديل نوع الحساب بنجاح" });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  return (
    <Sidebar side="right" collapsible="offcanvas" className="border-l shadow-sm fixed inset-y-0 z-50 bg-white">
      <SidebarHeader className="p-4 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="font-black text-xs text-zinc-400">قائمة "فهمت"</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1.5">
        {user && (
          <div className="p-1.5 shrink-0">
            <div className="bg-primary/5 p-3 rounded-2xl space-y-2.5 border border-primary/5 shadow-inner">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { handleLinkClick(); router.push('/profile'); }}>
                <Avatar className="h-10 w-10 border-2 border-white shadow-md shrink-0">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="text-[10px] font-black">{profile?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate min-w-0 text-right">
                  <span className="font-black text-[12px] truncate">{profile?.fullName}</span>
                  <Badge variant="secondary" className="w-fit text-[8px] h-4 mt-0.5 mr-auto px-1.5 font-black">
                    {profile?.role === 'mufhem' ? 'مفهم' : 'مستفهم'}
                  </Badge>
                </div>
              </div>
              <button onClick={toggleRole} className="w-full h-10 rounded-xl text-[11px] font-black border-2 border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm">
                <RefreshCw className="h-4 w-4" /> تبديل إلى {profile?.role === 'mufhem' ? 'مستفهم' : 'مفهم'}
              </button>
            </div>
          </div>
        )}

        <SidebarMenu className="space-y-1 pt-4 overflow-y-auto no-scrollbar px-1">
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} onClick={handleLinkClick}>
              <Link href="/">
                <Home className="h-5 w-5 text-primary" />
                <span className="font-bold">الرئيسية</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/offers"} onClick={handleLinkClick}>
                  <Link href="/offers">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-bold">عروضي</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/requests"} onClick={handleLinkClick}>
                  <Link href="/requests">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <span className="font-bold">استفهاماتي</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}

          <SidebarSeparator className="my-2" />

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/teachers"} onClick={handleLinkClick}>
              <Link href="/teachers">
                <Users className="h-5 w-5 text-zinc-500" />
                <span className="font-bold">تصفح المفهمين</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/portfolio"} onClick={handleLinkClick}>
              <Link href="/portfolio">
                <Briefcase className="h-5 w-5 text-zinc-500" />
                <span className="font-bold">أعمال المفهمين</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/browse"} onClick={handleLinkClick}>
              <Link href="/browse">
                <Search className="h-5 w-5 text-zinc-500" />
                <span className="font-bold">الاستفهامات العامة</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator className="my-2" />

          {user && (
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Settings className="h-5 w-5 text-zinc-500" />
                    <span className="font-bold">الإعدادات</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-3 pr-3 border-r-2 border-zinc-100">
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === "/profile"} onClick={handleLinkClick}><Link href="/profile" className="font-bold text-xs"><User size={14} className="ml-2"/> ملفي الشخصي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === "/wallet"} onClick={handleLinkClick}><Link href="/wallet" className="font-bold text-xs"><Wallet size={14} className="ml-2"/> المحفظة</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <LifeBuoy className="h-5 w-5 text-zinc-500" />
                  <span className="font-bold">مركز المساعدة</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mr-3 pr-3 border-r-2 border-zinc-100">
                  <SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === "/guide"} onClick={handleLinkClick}><Link href="/guide" className="font-bold text-xs"><BookOpen size={14} className="ml-2"/> الدليل الإرشادي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  <SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === "/support"} onClick={handleLinkClick}><Link href="/support" className="font-bold text-xs"><HelpCircle size={14} className="ml-2"/> الأسئلة الشائعة</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {profile?.isAdmin && (
            <Collapsible className="group/collapsible" defaultOpen={true}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="mt-4 bg-accent/5 hover:bg-accent/10">
                    <LayoutDashboard className="h-5 w-5 text-accent shrink-0" />
                    <span className="font-black text-accent text-[14px]">لوحة المسؤول</span>
                    <ChevronDown className="ml-auto h-4 w-4 text-accent transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-3 pr-3 border-r-2 border-accent/20 space-y-1 mt-2 max-h-[500px] overflow-y-auto no-scrollbar pb-10">
                    <AdminLink href="/admin" icon={Home} label="نظرة عامة" active={pathname === "/admin"} />
                    
                    <div className="text-[10px] font-black text-zinc-400 uppercase mt-4 mb-2 pr-2">المالية والكوبونات</div>
                    <AdminLink href="/admin/coupons" icon={Ticket} label="إدارة الكوبونات" active={pathname === "/admin/coupons"} />
                    <AdminLink href="/admin/completed-orders" icon={CheckCircle2} label="الطلبات المكتملة" active={pathname === "/admin/completed-orders"} />
                    <AdminLink href="/admin/finance" icon={BadgeCent} label="إدارة المالية" active={pathname === "/admin/finance"} />
                    
                    <div className="text-[10px] font-black text-zinc-400 uppercase mt-4 mb-2 pr-2">الرقابة والاعتماد</div>
                    <AdminLink href="/admin/approvals" icon={FileCheck} label="مركز الاعتماد" active={pathname === "/admin/approvals"} />
                    <AdminLink href="/admin/verification" icon={ShieldCheck} label="مركز التوثيق" active={pathname === "/admin/verification"} />
                    <AdminLink href="/admin/pending-requests" icon={Clock} label="مراجعة الاستفهامات" active={pathname === "/admin/pending-requests"} />
                    <AdminLink href="/admin/portfolio-approvals" icon={FileSearch} label="مراجعة أعمال المفهمين" active={pathname === "/admin/portfolio-approvals"} />
                    <AdminLink href="/admin/all-requests" icon={Eye} label="رقابة المحاضرات" active={pathname === "/admin/all-requests"} />
                    <AdminLink href="/admin/sessions" icon={History} label="سجلات الرقابة والتوثيق" active={pathname === "/admin/sessions"} />
                    
                    <div className="text-[10px] font-black text-zinc-400 uppercase mt-4 mb-2 pr-2">المحتوى والأقسام</div>
                    <AdminLink href="/admin/categories" icon={Layers} label="إدارة الأقسام" active={pathname === "/admin/categories"} />
                    <AdminLink href="/admin/teacher-categories" icon={Filter} label="أقسام المفهمين" active={pathname === "/admin/teacher-categories"} />
                    <AdminLink href="/admin/jobs" icon={Briefcase} label="إدارة التوظيف" active={pathname === "/admin/jobs"} />
                    <AdminLink href="/admin/portfolio-management" icon={Layout} label="إدارة معرض الأعمال" active={pathname === "/admin/portfolio-management"} />
                    
                    <div className="text-[10px] font-black text-zinc-400 uppercase mt-4 mb-2 pr-2">المستخدمين والدعم</div>
                    <AdminLink href="/admin/mufahems" icon={Users} label="إدارة المفهمين" active={pathname === "/admin/mufahems"} />
                    <AdminLink href="/admin/mustafhems" icon={Users} label="إدارة المستفهمين" active={pathname === "/admin/mustafhems"} />
                    <AdminLink href="/admin/roles" icon={UserCog} label="إدارة الرتب" active={pathname === "/admin/roles"} />
                    <AdminLink href="/admin/auto-bans" icon={ShieldAlert} label="سجل الحظر التلقائي" active={pathname === "/admin/auto-bans"} />
                    <AdminLink href="/admin/appeals" icon={Scale} label="مركز الطعون" active={pathname === "/admin/appeals"} />
                    <AdminLink href="/admin/support" icon={MessageSquare} label="تذاكر الدعم" active={pathname === "/admin/support"} />
                    <AdminLink href="/admin/floating-chats" icon={Zap} label="النافذة العائمة" active={pathname === "/admin/floating-chats"} />
                    <AdminLink href="/admin/direct-chats" icon={MessageSquare} label="سجل المحادثات المباشرة" active={pathname === "/admin/direct-chats"} />
                    
                    <div className="text-[10px] font-black text-zinc-400 uppercase mt-4 mb-2 pr-2">النظام والتقنية</div>
                    <AdminLink href="/admin/ai" icon={Bot} label="الذكاء الاصطناعي" active={pathname === "/admin/ai"} />
                    <AdminLink href="/admin/deployment" icon={Cloud} label="النشر المباشر" active={pathname === "/admin/deployment"} />
                    <AdminLink href="/admin/assets" icon={ImageIcon} label="إدارة الصور والأصول" active={pathname === "/admin/assets"} />
                    <AdminLink href="/admin/customize" icon={Palette} label="تخصيص المنصة" active={pathname === "/admin/customize"} />
                    <AdminLink href="/admin/manual-editor" icon={Settings} label="المحرر الفائق و SEO" active={pathname === "/admin/manual-editor"} />
                    <AdminLink href="/admin/social-management" icon={Share2} label="إدارة قائمة تابعنا" active={pathname === "/admin/social-management"} />
                    <AdminLink href="/admin/logs" icon={History} label="سجل الرقابة الإدارية" active={pathname === "/admin/logs"} />
                    <AdminLink href="/admin/comm-test" icon={Send} label="اختبار المراسلات" active={pathname === "/admin/comm-test"} />
                    <AdminLink href="/admin/accounts" icon={Search} label="إدارة الحسابات" active={pathname === "/admin/accounts"} />
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t shrink-0">
        {user ? (
          <SidebarMenuButton onClick={handleLogout} className="h-12 rounded-xl text-destructive hover:bg-destructive/10 font-black">
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="text-[13px]">خروج من فهمت</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild onClick={handleLinkClick}>
            <Link href="/login" className="h-12 rounded-xl bg-primary text-white font-black flex items-center justify-center">
              <span>تسجيل دخول</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminLink({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active?: boolean }) {
  const { setOpen, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active} onClick={() => { setOpen(false); setOpenMobile(false); }}>
        <Link href={href} className="font-bold text-[11px] flex items-center gap-2 py-1">
          <Icon size={12} className={active ? "text-accent" : "text-zinc-400"} /> 
          <span className="truncate">{label}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
