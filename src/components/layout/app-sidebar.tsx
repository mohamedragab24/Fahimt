"use client";

import {
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  HelpCircle,
  Home,
  User as UserIcon,
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const menuItems = [
  { title: "الرئيسية", icon: Home, href: "/" },
  { title: "طلباتي", icon: ClipboardList, href: "/requests" },
  { title: "المحفظة", icon: Wallet, href: "/wallet" },
  { title: "الإعدادات", icon: Settings, href: "/profile" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, auth } = useFirebase();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <Sidebar side="right" collapsible="icon" className="border-l">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl">ف</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-black text-2xl font-headline leading-tight">فهمني</span>
            <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">التعليم الذكي</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Profile Snapshot */}
        <div className="p-4 group-data-[collapsible=icon]:hidden">
          <div className="bg-muted/30 p-4 rounded-2xl flex items-center gap-3 border border-dashed">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={profile?.profilePictureUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.fullName?.charAt(0) || 'أ'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm truncate">{profile?.fullName || 'جاري التحميل...'}</span>
              <span className="text-[10px] bg-primary/10 text-primary self-start px-2 py-0.5 rounded-full font-bold">
                {profile?.role === 'mufhem' ? 'مُفهم' : 'مُستفهم'}
              </span>
            </div>
          </div>
        </div>

        <SidebarMenu className="px-3 space-y-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                className={`py-6 rounded-xl transition-all ${
                  pathname === item.href 
                    ? "bg-primary text-white shadow-md hover:bg-primary/90" 
                    : "hover:bg-primary/5"
                }`}
              >
                <Link href={item.href} className="flex items-center gap-4 px-3">
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? "text-white" : "text-primary"}`} />
                  <span className="font-bold text-md">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="الدعم الفني"
              className="py-6 rounded-xl hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <Link href="https://wa.me/201234567890" target="_blank" className="flex items-center gap-4 px-3">
                <HelpCircle className="h-5 w-5 text-green-500" />
                <span className="font-bold group-data-[collapsible=icon]:hidden">الدعم الفني</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarSeparator className="my-2" />
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="py-6 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive transition-colors"
            >
              <div className="flex items-center gap-4 px-3 w-full">
                <LogOut className="h-5 w-5" />
                <span className="font-bold group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="text-[10px] text-center text-muted-foreground font-medium pt-2 group-data-[collapsible=icon]:hidden">
          إصدار 1.0.0 &copy; 2024
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}