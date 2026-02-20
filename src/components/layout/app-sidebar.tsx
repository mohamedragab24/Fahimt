
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
  CloudUpload,
  User,
  Info,
  FileText,
  HelpCircle,
  Bot,
  UserSearch,
  Layout,
  Search
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
        <div className="flex flex-col gap-1">
          <span className="font-black text-xs text-zinc-400">القائمة الرئيسية</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1.5">
        <div className="p-1.5 shrink-0">
          <div className="bg-primary/5 p-3 rounded-2xl space-y-2.5 border border-primary/5 shadow-inner">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { handleLinkClick(); router.push('/profile'); }}>
              <Avatar className="h-10 w-10 border-2 border-white shadow-md shrink-0">
                <AvatarImage src={profile?.profilePictureUrl} />
                <AvatarFallback className="text-[10px]">{profile?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate min-w-0">
                <span className="font-black text-[12px] truncate text-right">{profile?.fullName}</span>
                <Badge variant="secondary" className="w-fit text-[8px] h-4 mt-0.5 ml-auto px-1.5 font-black">
                  {profile?.role === 'mufhem' ? 'مُفهم معتمد' : 'مُستفهم طموح'}
                </Badge>
              </div>
            </div>
            <button onClick={toggleRole} className="w-full h-10 rounded-xl text-[11px] font-black border-2 border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm">
              <RefreshCw className="h-4 w-4" /> تبديل الحساب
            </button>
          </div>
        </div>

        <SidebarMenu className="space-y-1 pt-4 overflow-y-auto no-scrollbar px-1">
          
          {/* الروابط الشخصية */}
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

          <SidebarSeparator className="my-2" />

          {/* التصفح العام */}
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
                <Layout className="h-5 w-5 text-zinc-500" />
                <span className="font-bold">تصفح أعمال المفهمين</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/browse"} onClick={handleLinkClick}>
              <Link href="/browse">
                <Search className="h-5 w-5 text-zinc-500" />
                <span className="font-bold">تصفح الاستفهامات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator className="my-2" />

          {/* الإعدادات المنسدلة */}
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
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/profile"} onClick={handleLinkClick}>
                      <Link href="/profile" className="font-bold text-xs flex items-center gap-2">
                        <User size={14} /> حسابي
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/wallet"} onClick={handleLinkClick}>
                      <Link href="/wallet" className="font-bold text-xs flex items-center gap-2">
                        <Wallet size={14} /> محفظتي
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild onClick={handleLinkClick}>
                      <Link href="/profile" className="font-bold text-xs flex items-center gap-2">
                        <ShieldCheck size={14} /> توثيق الهوية
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild onClick={handleLinkClick}>
                      <Link href="/portfolio/add" className="font-bold text-xs flex items-center gap-2">
                        <ImageIcon size={14} /> معرض أعمالي
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* مركز المساعدة المنسدل */}
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
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/guide"} onClick={handleLinkClick}>
                      <Link href="/guide" className="font-bold text-xs">الدليل الإرشادي</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/support"} onClick={handleLinkClick}>
                      <Link href="/support" className="font-bold text-xs">الأسئلة الشائعة</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/support"} onClick={handleLinkClick}>
                      <Link href="/support" className="font-bold text-xs">مساعد الذكاء الاصطناعي</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/support"} onClick={handleLinkClick}>
                      <Link href="/support" className="font-bold text-xs">الدعم الفني</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* المزيد المنسدل */}
          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Info className="h-5 w-5 text-zinc-500" />
                  <span className="font-bold">المزيد</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mr-3 pr-3 border-r-2 border-zinc-100">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/about"} onClick={handleLinkClick}>
                      <Link href="/about" className="font-bold text-xs">عن فهمت</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/guarantees"} onClick={handleLinkClick}>
                      <Link href="/guarantees" className="font-bold text-xs">ضمان الحقوق</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/terms"} onClick={handleLinkClick}>
                      <Link href="/terms" className="font-bold text-xs">شروط الاستخدام</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/privacy"} onClick={handleLinkClick}>
                      <Link href="/privacy" className="font-bold text-xs">سياسة الخصوصية</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* لوحة المسؤول - تظهر فقط للمسؤولين */}
          {profile?.isAdmin && (
            <Collapsible className="group/collapsible" defaultOpen={pathname.startsWith('/admin')}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="mt-4 bg-accent/5 hover:bg-accent/10">
                    <LayoutDashboard className="h-5 w-5 text-accent shrink-0" />
                    <span className="font-black text-accent text-[14px]">لوحة المسؤول</span>
                    <ChevronDown className="ml-auto h-4 w-4 text-accent transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-3 pr-3 border-r-2 border-accent/20 space-y-1 mt-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={pathname === "/admin"} onClick={handleLinkClick}>
                        <Link href="/admin" className="font-bold text-xs">نظرة عامة</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={pathname === "/admin/manual-editor"} onClick={handleLinkClick}>
                        <Link href="/admin/manual-editor" className="font-bold text-xs">المحرر الفائق</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={pathname === "/admin/approvals"} onClick={handleLinkClick}>
                        <Link href="/admin/approvals" className="font-bold text-xs">مركز الاعتماد</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={pathname === "/admin/finance"} onClick={handleLinkClick}>
                        <Link href="/admin/finance" className="font-bold text-xs">إدارة المالية</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t shrink-0">
        <SidebarMenuButton onClick={handleLogout} className="h-12 rounded-xl text-destructive hover:bg-destructive/10 font-black">
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-[13px]">تسجيل الخروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
