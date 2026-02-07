
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles, Bell, Video, User, Settings, LogOut, ShieldCheck, LifeBuoy } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useFirebase } from "@/firebase";
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export function Header() {
  const { user, auth } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  // إشعارات المحاضرات المقبولة
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const requestsRef = collection(firestore, "requests");
    const field = profile?.role === "mufhem" ? "teacherId" : "studentId";
    return query(
      requestsRef,
      where(field, "==", user.uid),
      where("status", "==", "accepted"),
      limit(5)
    );
  }, [firestore, user, profile?.role]);

  const { data: acceptedRequests } = useCollection(notificationsQuery);

  // إشعارات تذاكر الدعم التي تم الرد عليها
  const supportQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "supportTickets"),
      where("userId", "==", user.uid),
      where("status", "==", "replied"),
      limit(5)
    );
  }, [firestore, user]);

  const { data: supportReplies } = useCollection(supportQuery);

  const totalNotifications = (acceptedRequests?.length || 0) + (supportReplies?.length || 0);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 text-primary" />
          <div className="flex items-center gap-2 mr-2 cursor-pointer" onClick={() => router.push("/")}>
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
                {totalNotifications > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <DropdownMenuLabel className="text-lg font-black p-3">مركز الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {totalNotifications > 0 ? (
                  <>
                    {acceptedRequests?.map((req: any) => (
                      <DropdownMenuItem 
                        key={req.id} 
                        className="p-4 rounded-xl cursor-pointer hover:bg-primary/5 border-b last:border-0"
                        onClick={() => router.push(`/meeting/${req.id}`)}
                      >
                        <div className="flex gap-4">
                          <div className="bg-blue-100 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                            <Video className="text-blue-600 h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm leading-tight">محاضرة بانتظارك: {req.title}</p>
                            <p className="text-[10px] text-muted-foreground">اضغط لدخول البث الآن</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {supportReplies?.map((ticket: any) => (
                      <DropdownMenuItem 
                        key={ticket.id} 
                        className="p-4 rounded-xl cursor-pointer hover:bg-orange-50 border-b last:border-0"
                        onClick={() => router.push(`/support`)}
                      >
                        <div className="flex gap-4">
                          <div className="bg-orange-100 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                            <LifeBuoy className="text-orange-600 h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm leading-tight">رد جديد على تذكرتك: {ticket.subject}</p>
                            <p className="text-[10px] text-muted-foreground">اضغط لمشاهدة رد الإدارة</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm font-bold">
                    لا توجد إشعارات جديدة حالياً
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <Button variant="ghost" onClick={() => router.push('/requests')} className="w-full font-bold text-primary hover:text-primary py-2 text-sm">عرض كل الطلبات</Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-12 px-2 rounded-2xl hover:bg-primary/5">
                <div className="hidden md:flex flex-col text-left items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold leading-none">{profile?.fullName || "جاري التحميل..."}</span>
                    {profile?.role === 'mufhem' && <ShieldCheck className="h-3 w-3 text-blue-500" />}
                  </div>
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-2" dir="rtl">
              <DropdownMenuLabel className="font-black p-3 text-right">حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="p-3 rounded-xl cursor-pointer flex justify-end">
                <span className="font-bold">الملف الشخصي</span>
                <User className="mr-2 h-4 w-4 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/wallet')} className="p-3 rounded-xl cursor-pointer flex justify-end">
                <span className="font-bold">المحفظة</span>
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')} className="p-3 rounded-xl cursor-pointer flex justify-end">
                <span className="font-bold">الإعدادات</span>
                <Settings className="mr-2 h-4 w-4 text-primary" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-xl cursor-pointer text-destructive focus:text-destructive flex justify-end">
                <span className="font-bold">تسجيل الخروج</span>
                <LogOut className="mr-2 h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
