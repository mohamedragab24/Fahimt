
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles, Bell, MessageSquare, Video } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 text-primary" />
          <div className="flex items-center gap-2 mr-2">
            <div className="bg-primary p-1.5 rounded-lg shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl font-headline hidden sm:inline-block">فهمني</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-primary/5 text-muted-foreground transition-all">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <DropdownMenuLabel className="text-lg font-black p-3">الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem className="p-4 rounded-xl cursor-pointer hover:bg-primary/5 border-b last:border-0">
                  <div className="flex gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                      <Video className="text-blue-600 h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm leading-tight">تم قبول طلبك! رابط المحاضرة متاح الآن.</p>
                      <p className="text-[10px] text-muted-foreground">منذ دقيقتين</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-4 rounded-xl cursor-pointer hover:bg-primary/5 border-b last:border-0">
                  <div className="flex gap-4">
                    <div className="bg-green-100 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                      <MessageSquare className="text-green-600 h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm leading-tight">رسالة جديدة من المفهم بخصوص المحاضرة.</p>
                      <p className="text-[10px] text-muted-foreground">منذ ساعة</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <Button variant="ghost" className="w-full font-bold text-primary hover:text-primary py-2 text-sm">عرض كل الإشعارات</Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex flex-col text-left items-end mr-2">
            <span className="text-sm font-bold leading-none">{profile?.fullName || "جاري التحميل..."}</span>
            <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter">
              {profile?.role === "mufhem" ? "مُفهم معتمد" : "مُستفهم طموح"}
            </span>
          </div>
          <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={profile?.profilePictureUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {profile?.fullName?.charAt(0) || "ف"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

