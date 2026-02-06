
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ArrowRight, Video, ShieldCheck, Copy, Check, Star, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

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

  // تحديث حالة "الدخول" للتنبيه
  useEffect(() => {
    if (requestRef && profile) {
      const field = profile.role === 'mufhem' ? 'teacherJoined' : 'studentJoined';
      updateDocumentNonBlocking(requestRef, { [field]: true });
    }
  }, [requestRef, profile]);

  // التنبيه عند دخول الطرف الآخر
  useEffect(() => {
    if (request && profile) {
      if (profile.role === 'mufhem' && request.studentJoined) {
        toast({ title: "وصل الطالب!", description: `${request.studentName} دخل المحاضرة الآن.` });
      } else if (profile.role === 'mustafhem' && request.teacherJoined) {
        toast({ title: "وصل المعلم!", description: `${request.teacherName || "المعلم"} دخل المحاضرة الآن.` });
      }
    }
  }, [request?.studentJoined, request?.teacherJoined]);

  const startMeeting = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainerRef.current && profile && request) {
      const domain = "8x8.vc";
      const options = {
        roomName: `vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/${requestId}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: profile.fullName || "مستخدم فهمني",
          email: profile.email,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'chat', 'raisehand',
            'tileview', 'hangup', 'videoquality', 'settings'
          ],
        },
      };
      const newApi = new window.JitsiMeetExternalAPI(domain, options);
      setApi(newApi);

      newApi.addEventListener('videoConferenceLeft', () => {
        if (profile.role === 'mustafhem') {
          setShowRating(true);
        } else {
          router.push("/requests");
        }
      });
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(requestId as string);
    setCopied(true);
    toast({ title: "تم النسخ!", description: "تم نسخ معرف المحاضرة للحافظة." });
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRating = () => {
    if (requestRef) {
      updateDocumentNonBlocking(requestRef, {
        rating,
        review,
        status: 'completed'
      });
      toast({ title: "شكراً لتقييمك!", description: "رأيك يساعدنا على تحسين الخدمة." });
      router.push("/requests");
    }
  };

  if (isLoading) return <div className="h-screen flex flex-col items-center justify-center font-black text-2xl animate-pulse bg-zinc-950 text-white">
    <div className="w-20 h-20 bg-primary rounded-3xl mb-6 animate-bounce flex items-center justify-center">
      <Video className="h-10 w-10" />
    </div>
    جاري تأمين الغرفة...
  </div>;

  if (!request) return <div className="h-screen flex items-center justify-center font-black text-2xl">عذراً، الرابط غير صالح</div>;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script 
        src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" 
        onLoad={startMeeting}
      />
      
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 relative z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/requests")} className="text-white hover:bg-white/10 rounded-full">
            <ArrowRight className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight flex items-center gap-2">
              {request.title}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white" onClick={copyId}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <ShieldCheck className="h-3 w-3 text-green-500" />
              اتصال مشفر وآمن | معرف الطلب: {requestId?.slice(0, 8)}...
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => { api?.executeCommand('hangup'); }} 
            className="rounded-full px-6 font-bold shadow-lg shadow-red-500/20"
          >
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-zinc-950">
        <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black">كيف كانت المحاضرة؟</DialogTitle>
            <DialogDescription className="text-right text-lg">تقييمك يساعد المفهمين على التطور ويساعد الطلاب الآخرين.</DialogDescription>
          </DialogHeader>
          <div className="py-10 space-y-8 flex flex-col items-center">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-125">
                  <Star className={`h-12 w-12 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                </button>
              ))}
            </div>
            <div className="w-full space-y-3">
              <Label className="text-xl font-bold">رأيك بالتفصيل (اختياري)</Label>
              <Textarea 
                placeholder="أخبرنا المزيد عن تجربتك..." 
                className="h-32 rounded-2xl p-4 text-lg border-2 focus:border-primary"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitRating} className="w-full py-8 text-2xl font-black rounded-2xl shadow-xl">
              إرسال التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
