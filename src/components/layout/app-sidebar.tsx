
"use client";

import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const menuItems = [
  { title: "الرئيسية", icon: Home, href: "/" },
  { title: "طلباتي", icon: ClipboardList, href: "/requests" },
  { title: "المحفظة", icon: Wallet, href: "/wallet" },
  { title: "الإعدادات", icon: Settings, href: "/profile" },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Mock user data - in real app, fetch from context/auth
  const user = {
    fullName: "أحمد علي",
    role: "مُستفهم",
    avatarUrl: "https://picsum.photos/seed/user123/200/200",
  };

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <span className="text-primary-foreground font-bold text-xl">ف</span>
          </div>
          <span className="font-headline font-bold text-xl group-data-[collapsible=icon]:hidden">
            فهمني
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                className="py-6"
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>أ</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold">{user.fullName}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="الدعم الفني">
              <Link href="https://wa.me/1234567890" target="_blank">
                <HelpCircle className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">الدعم الفني</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
