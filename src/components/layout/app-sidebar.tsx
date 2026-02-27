
"use client";

import {
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  Home,
  Users,
  Briefcase,
  HelpCircle,
  MessageSquare,
  Zap,
  User,
  Search,
  RefreshCw,
  Bell,
  BookOpen,
  Menu,
  ChevronDown
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

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userRef);

  const handleLinkClick = () => { setOpen(false); setOpenMobile(false); };
  const handleLogout = async () => { handleLinkClick(); await signOut(auth); router.push("/login"); };

  const toggleRole = async () => {
    if (!profile || !userRef) return;
    const newRole = profile.role === 'mufhem' ? 'mustafhem' : 'mufhem';
    await updateDoc(userRef, { role: newRole });
    toast({ title: "تم التبديل بنجاح" });
    router.push("/");
  };

  return (
    <Sidebar side="right" collapsible="offcanvas" className="border-l shadow-sm fixed inset-y-0 z-50 bg-white">
      <SidebarHeader className="p-4 shrink-0 text-right"><span className="font-black text-xs text-zinc-400">قائمة فهمت</span></SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-1.5 overflow-y-auto no-scrollbar">
        {user && (
          <div className="p-1.5 shrink-0">
            <div className="bg-primary/5 p-3 rounded-2xl space-y-2.5 border text-right">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { handleLinkClick(); router.push('/profile'); }}>
                <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                  <AvatarImage src={profile?.profilePictureUrl} />
                  <AvatarFallback className="text-[10px] font-black">{profile?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate min-w-0">
                  <span className="font-black text-[12px] truncate">{profile?.fullName}</span>
                  <Badge variant="secondary" className="w-fit text-[8px] h-4 mt-0.5 mr-auto px-1.5">{profile?.role === 'mufhem' ? 'مفهم' : 'مستفهم'}</Badge>
                </div>
              </div>
              <button onClick={toggleRole} className="w-full h-10 rounded-xl text-[11px] font-black border-2 border-primary/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5">
                <RefreshCw className="h-4 w-4" /> تبديل إلى {profile?.role === 'mufhem' ? 'مستفهم' : 'مفهم'}
              </button>
            </div>
          </div>
        )}
        <SidebarMenu className="space-y-1 pt-4 text-right">
          <MenuLink href="/" icon={Home} label="الرئيسية" active={pathname === "/"} onClick={handleLinkClick} />
          {user && (
            <>
              <MenuLink href="/notifications" icon={Bell} label="الإشعارات" active={pathname === "/notifications"} onClick={handleLinkClick} />
              <MenuLink href="/messages" icon={MessageSquare} label="رسائلي" active={pathname === "/messages"} onClick={handleLinkClick} />
              <MenuLink href="/requests" icon={ClipboardList} label="استفهاماتي" active={pathname === "/requests"} onClick={handleLinkClick} />
            </>
          )}
          <SidebarSeparator className="my-2" />
          <MenuLink href="/teachers" icon={Users} label="تصفح المفهمين" active={pathname === "/teachers"} onClick={handleLinkClick} />
          <MenuLink href="/portfolio" icon={Briefcase} label="أعمال المفهمين" active={pathname === "/portfolio"} onClick={handleLinkClick} />
          <MenuLink href="/browse" icon={Search} label="الاستفهامات المطروحة" active={pathname === "/browse"} onClick={handleLinkClick} />
          <SidebarSeparator className="my-2" />
          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild><SidebarMenuButton className="text-right"><Settings className="h-5 w-5 ml-2" /><span className="font-bold">الإعدادات</span><ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" /></SidebarMenuButton></CollapsibleTrigger>
              <CollapsibleContent><SidebarMenuSub className="mr-3 pr-3 border-r-2"><SidebarMenuSubItem><SidebarMenuSubButton asChild><Link href="/profile" className="font-bold text-xs"><User size={14} className="ml-2"/> الملف الشخصي</Link></SidebarMenuSubButton></SidebarMenuSubItem><SidebarMenuSubItem><SidebarMenuSubButton asChild><Link href="/wallet" className="font-bold text-xs"><Wallet size={14} className="ml-2"/> المحفظة</Link></SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub></CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <Collapsible className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild><SidebarMenuButton className="text-right"><HelpCircle className="h-5 w-5 ml-2" /><span className="font-bold">مركز المساعدة</span><ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" /></SidebarMenuButton></CollapsibleTrigger>
              <CollapsibleContent><SidebarMenuSub className="mr-3 pr-3 border-r-2"><SidebarMenuSubItem><SidebarMenuSubButton asChild><Link href="/guide" className="font-bold text-xs"><BookOpen size={14} className="ml-2"/> الدليل الإرشادي</Link></SidebarMenuSubButton></SidebarMenuSubItem><SidebarMenuSubItem><SidebarMenuSubButton asChild><Link href="/support" className="font-bold text-xs"><MessageSquare size={14} className="ml-2"/> الأسئلة الشائعة</Link></SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub></CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t">
        {user ? (
          <SidebarMenuButton onClick={handleLogout} className="h-12 rounded-xl text-red-600 font-black"><LogOut className="h-5 w-5 ml-2" /><span>خروج من فهمت</span></SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild onClick={handleLinkClick}><Link href="/login" className="h-12 rounded-xl bg-primary text-white font-black flex items-center justify-center"><span>دخول / تسجيل</span></Link></SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function MenuLink({ href, icon: Icon, label, active, onClick }: any) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} onClick={onClick}>
        <Link href={href} className="text-right"><Icon className="h-5 w-5 ml-2 text-primary" /><span className="font-bold">{label}</span></Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
