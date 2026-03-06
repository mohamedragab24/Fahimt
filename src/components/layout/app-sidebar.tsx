
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
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  Info,
  FileText,
  ShieldAlert,
  History,
  Layout,
  Star,
  PlusCircle,
  ArrowRightLeft
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

  const isMasterAdmin = user?.email === "mohamed76y@gmail.com" || user?.email === "mohamjedminijd2006@gmail.com";
  const isAdmin = profile?.isAdmin || isMasterAdmin;

  const NavItem = ({ href, icon: Icon, label }: any) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === href} onClick={handleLinkClick}>
        <Link href={href} className="text-right flex-row-reverse justify-end font-bold">
          <Icon className="h-5 w-5 ml-3 text-primary" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar side="right" collapsible="offcanvas" className="border-l shadow-xl bg-white">
      <SidebarHeader className="p-6 shrink-0 text-right">
        <div className="flex items-center justify-end gap-3">
          <span className="font-black text-xl text-primary">فهمت</span>
          <div className="w-8 h-8 bg-primary rounded-lg"></div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 overflow-y-auto no-scrollbar">
        {user ? (
          <SidebarMenu className="space-y-1">
            <NavItem href="/offers" icon={Zap} label="عروضي" />
            <NavItem href="/requests" icon={ClipboardList} label="استفهاماتي" />
            <NavItem href="/sessions" icon={History} label="جلساتي" />
            
            <SidebarSeparator className="my-4" />
            
            <NavItem href="/teachers" icon={Users} label="تصفح المفهمين" />
            <NavItem href="/portfolio" icon={Layout} label="تصفح أعمال المفهمين" />
            <NavItem href="/browse" icon={Search} label="تصفح الاستفهامات" />
            
            <SidebarSeparator className="my-4" />

            {/* الإعدادات */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="text-right flex-row-reverse justify-end font-bold">
                    <Settings className="h-5 w-5 ml-3 text-primary" />
                    <span>الإعدادات</span>
                    <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-8 pr-4 border-r-2 border-primary/10 space-y-1">
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/profile" className="font-bold text-xs py-2">الملف الشخصي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/wallet" className="font-bold text-xs py-2">محفظتي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/portfolio/manage" className="font-bold text-xs py-2">معرض أعمالي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* مركز المساعدة */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="text-right flex-row-reverse justify-end font-bold">
                    <HelpCircle className="h-5 w-5 ml-3 text-primary" />
                    <span>مركز المساعدة</span>
                    <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-8 pr-4 border-r-2 border-primary/10 space-y-1">
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/guide" className="font-bold text-xs py-2">الدليل الإرشادي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/support" className="font-bold text-xs py-2">الأسئلة الشائعة</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/contact-us" className="font-bold text-xs py-2">الدعم الفني</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* المزيد */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="text-right flex-row-reverse justify-end font-bold">
                    <PlusCircle className="h-5 w-5 ml-3 text-primary" />
                    <span>المزيد</span>
                    <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-8 pr-4 border-r-2 border-primary/10 space-y-1">
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/about" className="font-bold text-xs py-2">عن فهمت</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/guarantees" className="font-bold text-xs py-2">ضمان الحقوق</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/terms" className="font-bold text-xs py-2">شروط الاستخدام</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/privacy-policy" className="font-bold text-xs py-2">سياسة الخصوصية</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/refund-policy" className="font-bold text-xs py-2">سياسة الاسترجاع</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/jobs" className="font-bold text-xs py-2">الوظائف</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {isAdmin && (
              <NavItem href="/admin" icon={LayoutDashboard} label="لوحة المسؤول" />
            )}
          </SidebarMenu>
        ) : (
          /* حالة عدم تسجيل الدخول */
          <SidebarMenu className="space-y-1">
            <NavItem href="/teachers" icon={Users} label="تصفح المفهمين" />
            <NavItem href="/portfolio" icon={Layout} label="تصفح أعمال المفهمين" />
            <NavItem href="/browse" icon={Search} label="تصفح الاستفهامات" />
            
            <SidebarSeparator className="my-4" />

            {/* مركز المساعدة */}
            <Collapsible className="group/collapsible" defaultOpen>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="text-right flex-row-reverse justify-end font-bold">
                    <HelpCircle className="h-5 w-5 ml-3 text-primary" />
                    <span>مركز المساعدة</span>
                    <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-8 pr-4 border-r-2 border-primary/10 space-y-1">
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/guide" className="font-bold text-xs py-2">الدليل الإرشادي</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/support" className="font-bold text-xs py-2">الأسئلة الشائعة</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/contact-us" className="font-bold text-xs py-2">الدعم الفني</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* المزيد */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="text-right flex-row-reverse justify-end font-bold">
                    <PlusCircle className="h-5 w-5 ml-3 text-primary" />
                    <span>المزيد</span>
                    <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-8 pr-4 border-r-2 border-primary/10 space-y-1">
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/about" className="font-bold text-xs py-2">عن فهمت</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/guarantees" className="font-bold text-xs py-2">ضمان الحقوق</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/terms" className="font-bold text-xs py-2">شروط الاستخدام</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/privacy-policy" className="font-bold text-xs py-2">سياسة الخصوصية</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/refund-policy" className="font-bold text-xs py-2">سياسة الاسترجاع</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton asChild onClick={handleLinkClick}><Link href="/jobs" className="font-bold text-xs py-2">الوظائف</Link></SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t bg-zinc-50">
        {user ? (
          <SidebarMenuButton onClick={handleLogout} className="h-12 rounded-xl text-red-600 font-black flex-row-reverse justify-end">
            <LogOut className="h-5 w-5 ml-3" />
            <span>خروج</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild onClick={handleLinkClick}>
            <Link href="/login" className="h-12 rounded-xl bg-primary text-white font-black flex items-center justify-center">
              <span>دخول / تسجيل</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
