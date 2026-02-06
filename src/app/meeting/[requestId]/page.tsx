
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ArrowRight, Video, Mic, Share2, LogOut } from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function MeetingPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "requests", requestId as string);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    if (!isLoading && request && user) {
      // التحقق من أن المستخدم هو الطالب أو المعلم في هذا الطلب
      if (request.studentId !== user.uid && request.teacherId !== user.uid) {
        // router.push("/"); // حماية الجلسة
      }
    }
  }, [request, user, isLoading, router]);

  const startMeeting = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainerRef.current && profile && request) {
      const domain = "8x8.vc";
      const options = {
        roomName: `vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/${requestId}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: profile.fullName,
          email: profile.email,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
        },
      };
      const newApi = new window.JitsiMeetExternalAPI(domain, options);
      setApi(newApi);

      newApi.addEventListener('videoConferenceLeft', () => {
        router.push("/requests");
      });
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse">جاري تجهيز الغرفة...</div>;
  if (!request) return <div className="h-screen flex items-center justify-center font-black text-2xl">الطلب غير موجود</div>;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script 
        src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" 
        onLoad={startMeeting}
      />
      
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/requests")} className="text-white hover:bg-white/10 rounded-full">
            <ArrowRight className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{request.title}</h1>
            <p className="text-zinc-400 text-xs">جلسة تعليمية مباشرة</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 text-xs font-bold">بث مباشر</span>
          </div>
          <Button variant="destructive" size="sm" onClick={() => { api?.executeCommand('hangup'); router.push("/requests"); }} className="rounded-full px-6 font-bold">
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}
