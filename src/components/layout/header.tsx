
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-left items-end">
            <span className="text-sm font-bold leading-none">{profile?.fullName || "جاري التحميل..."}</span>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
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
